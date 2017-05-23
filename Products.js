import React, { Component, PropTypes } from 'react'
import stringify from 'json-stable-stringify'
import Lodash from 'lodash'
import Product from './Product'
import { getProductsForReturnOrder, formatProductsWithCustomization } from '../models/product.model'

export default class Products extends Component {
	constructor() {
    	super(...arguments);
        this.state = {
            productDiff: {},
            products: Lodash.reverse(this.props.products)
    	}
    }
	componentWillReceiveProps(nextProps) {
        if (stringify(nextProps) !== stringify(this.props)) {
        	let productDiff = Lodash.differenceBy(nextProps.products, this.props.products, stringify);
            this.setState({
                productDiff: Lodash.last(productDiff),
                products: Lodash.reverse(nextProps.products)
            })
        }
    }
	render(){
		let { lang, currency, dispatch, taxIncluded, taxEnabled, returnOrder, order, idAddressDelivery, plugins, configurations } = this.props;
		const { productDiff } = this.state;
		let products = plugins.hsposproductcustomization ? formatProductsWithCustomization(this.props.products, plugins.hsposproductcustomization) : this.props.products;
		let enableImagesInShoppingCart = !Lodash.isEmpty(Lodash.find(products, function(product){return !Lodash.isNull(product.imageUrl)}))
										  || !Lodash.isEmpty(Lodash.find(order.products, function(product){return !Lodash.isNull(product.imageUrl)}));
		if (Object.keys(lang).length === 0 || (products.length == 0 && Lodash.isEmpty(order.products))) {
			return null;
		} else {
			let cartProducts = [];
			if (products.length > 0) {
				cartProducts = products.map((product) => {
					const highlightNewProduct = returnOrder ? true : stringify(productDiff) === stringify(product);
		            return (
		            	<Product
		            		highlightNewProduct = {highlightNewProduct}
			            	currency = {currency}
			            	lang = {lang}
			            	dispatch = {dispatch}
			            	product = {product}
			            	returnOrder={returnOrder}
			            	order={order}
							idAddressDelivery={idAddressDelivery}
							plugins={plugins}
							configurations={configurations}
		            	/>
		            );
	        	});
			}
			let orderProducts = [];
			if (!Lodash.isEmpty(order['products'])) {
				orderProducts = plugins.hsposproductcustomization ? formatProductsWithCustomization( order['products'], plugins.hsposproductcustomization, true) : order['products'];
			    orderProducts = orderProducts.map((product) => {
		            return (
		            	<Product
		            		highlightNewProduct = {false}
			            	currency = {currency}
			            	lang = {lang}
			            	dispatch = {dispatch}
			            	product = {product}
			            	returnOrder={true}
			            	order={order}
							isOldProduct={true}
							idAddressDelivery={idAddressDelivery}
							plugins={plugins}
							configurations={configurations}
		            	/>
		            );
		        });
		    }
	    let taxLabel = null;
	    if (taxEnabled) {
	    	taxLabel = taxIncluded ? lang.tax_incl : lang.tax_excl;
	    }
		return (
			<div id="cart_detail">
				<table className="bordered-row">
					<thead>
						<tr>
							{
								enableImagesInShoppingCart ?
								<th className="product-image-th">{lang.image}</th>
								:
								null
							}
							<th width="40%" className="product-name">{lang.name}</th>
							<th className="qty">{lang.qty}</th>
							<th className="unit-price">{lang.u_p}{taxLabel !== null ? <span>&nbsp;<i className="fa fa-info-circle" aria-hidden="true" title={taxLabel}></i></span> : null}</th>
							<th className="discount">{lang.disc} (%)</th>
							<th className="total">{lang.total}</th>
							<th>&nbsp;</th>
						</tr>
					</thead>

					<tbody>
						{cartProducts}
						{orderProducts}
					</tbody>
				</table>
			</div>

		)
		}
	}
}

Products.propTypes = {
  	lang: PropTypes.object.isRequired,
  	products: PropTypes.array.isRequired, // arrayOf(shapes->Product)
  	currency: PropTypes.object, // shape(shapes->Currency)
  	taxIncluded: PropTypes.bool,
  	taxEnabled: PropTypes.bool,
  	returnOrder: PropTypes.bool.isRequired,
  	idCart: PropTypes.number.isRequired,
  	order: PropTypes.object, // shape(shapes->Order)
}
