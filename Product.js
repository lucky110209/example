import React, { Component, PropTypes } from 'react'
import Loading from './Loading'
import NewsalePopup from './NewsalePopup'
import ProductCustomization from './ProductCustomization'
import ChangeCombinationContainer from '../containers/ChangeCombinationContainer'
import { deleteProduct, setSelectedProduct, edit } from '../actions/products.actions'
import { requestGetCombinations } from '../actions/combinations.actions'
import { isDiscount, isPrice, isQuantity, isReturnQuantity } from '../models/validate.model'
import * as Utility from '../utility'
import * as Return from '../plugins/return'
import stringify from 'json-stable-stringify'
import Lodash from 'lodash'
import classNames from 'classnames'

export default class Product extends NewsalePopup  {
	constructor() {
		super(...arguments);
		const { product } = this.props;
		this.state = {
			modifiedFields: this.getProduct(product),
			isLoading: false,
			validates : {},
			disabled: {},
		}
	}
    getProduct(product){
        return {
            priceWithReduction:Utility.displayPrice(product.priceWithReduction),
            reduction: product.reductionType == 'amount' ? 0 : parseFloat(product.reduction),
            quantity: product.quantity
        }
    }
	onSubmit(){
		const { product } = this.props;
		const { validates  } = this.state;
		const modifiedFields = Lodash.cloneDeep(this.state.modifiedFields);

		Lodash.forEach(this.getProduct(product), function(value, key){
			if (modifiedFields[key] == value) {
				delete modifiedFields[key];
			}
		})
		Lodash.forEach(validates, function(value, key){
			if (typeof modifiedFields[key] !== 'undefined' && value === 'invalid' ) {
				delete modifiedFields[key];
			}
		})
        if (!Lodash.isEmpty(modifiedFields)) {
			let fields = Lodash.cloneDeep(modifiedFields);
			if(typeof fields.quantity !== 'undefined'){
				fields.quantity = fields.quantity - product.quantity;
			}
            this.props.dispatch(edit(parseInt(product.idProduct), parseInt(product.idProductAttribute), fields, product.idCustomization, this.onSuccess.bind(this), this.onError.bind(this)))
            this.setState({
                isLoading: true
            });
        }
    }
	onKeyDown(event){
		if (event.keyCode === 13) {
			this.onSubmit();
		}
	}
    onClick(event){
        event.target.select();
    }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;
        const { validates, disabled }  = this.state;
		const modifiedFields = Lodash.cloneDeep(this.state.modifiedFields);
        const product = this.getProduct(this.props.product);
        switch(name){
            case 'quantity':
                validates[name] = isQuantity(value) ? 'valid' : 'invalid';
                if(parseInt(value) === parseInt(product[name]) && validates[name] === 'valid') {
                    Lodash.unset(validates, name);
                }
                modifiedFields[name] = value;
                break;
            case 'priceWithReduction':
                validates[name] = isPrice(value) && value != '' ? 'valid' : 'invalid';
                disabled['reduction'] = isPrice(value);
                if(Utility.displayPrice(value) === product[name] && validates[name] === 'valid') {
                    Lodash.unset(validates, name);
                    Lodash.unset(disabled, 'reduction');
                }
                modifiedFields[name] = value;
                break;
            case 'reduction':
                validates[name] = isDiscount(value) ? 'valid' : 'invalid';
                disabled['priceWithReduction'] = isDiscount(value);
                if(parseFloat(value) === product[name] && validates[name] === 'valid') {
                    Lodash.unset(validates, name);
                    Lodash.unset(disabled, 'priceWithReduction');
                }
                modifiedFields[name] = value;
                break;
        }

        this.setState({
            modifiedFields: modifiedFields,
            validates : validates,
            disabled: disabled
        });
	}
	onError() {
		this.setState({
			isLoading: false,
			modifiedFields: this.getProduct(this.props.product),
			disabled: {},
			validates: {}
		});
	}
	onSuccess(){
		this.setState({
			isLoading: false,
			disabled: {},
			validates: {}
		})
	}
	handleChangeQuantityRefunded(event){
		const { product, order } = this.props;
		const { validates }  = this.state;
		const idOrderDetail = order.products.find(function(o){return o.idProduct == product.idProduct && o.idProductAttribute == product.idProductAttribute}).idOrderDetail
		const refundProduct = {
			idProduct: parseInt(product.idProduct),
			quantity: parseInt(event.target.value),
			idProductAttribute: parseInt(product.idProductAttribute),
			idOrderDetail: parseInt(idOrderDetail),
			idCustomization: parseInt(product.idCustomization ? product.idCustomization : 0)
		};
		validates['quantity'] = isReturnQuantity(event.target.value, product.quantity) ? 'valid' : 'invalid';
		if (validates['quantity'] === 'valid') {
			this.props.dispatch(Return.actions.changeRefundProducts(refundProduct, true));
		} else {
			this.props.dispatch(Return.actions.changeRefundProducts([], false));
		}
		if(parseInt(event.target.value) === 0 && validates['quantity'] === 'valid') {
			Lodash.unset(validates, 'quantity');
		}
		this.setState({
			validates: validates
		})

	}
	componentWillReceiveProps(nextProps) {
		if (stringify(nextProps) !== stringify(this.props)) {
			const modifiedFields = this.getProduct(nextProps.product);
			this.setState({
				modifiedFields: modifiedFields
			})
		}
	}

	showChangeCombinationPopup(product){
		if(!Lodash.isEmpty(product.combination)){
			this.props.dispatch(setSelectedProduct(product))
			if (parseInt(product.idProductAttribute) > 0){
				this.props.dispatch(requestGetCombinations(product));
				this.openPopup(<ChangeCombinationContainer />, 'combination-popup');
			}

		}
	}
	showCustomizationPopup(event , customizationDatas, invalid){
		let { product, dispatch, lang, currency, returnOrder, idAddressDelivery, configurations, isOldProduct } =  this.props;
		this.openPopup(<ProductCustomization
							lang={lang}
							dispatch={dispatch}
							returnOrder={returnOrder}
							product={product}
							closePopup={this.closePopup.bind(this)}
							idAddressDelivery={idAddressDelivery}
							configurations={configurations}
							invalid={invalid}
							isOldProduct={isOldProduct}
							customizationDatas={customizationDatas}
							reopenCustomizationPopup={this.reopenCustomizationPopup.bind(this)}
						/>, 'customize');
	}
	reopenCustomizationPopup(customizationDatas, invalid){
		if(!confirm(this.props.lang.do_you_want_to_leave + '\n' + this.props.lang.your_customization_is_not_saved)){
			this.showCustomizationPopup(null, customizationDatas, invalid);
		}

	}
	renderProductForReturnOrder(){
		const { product, dispatch, lang, currency, highlightNewProduct, returnTransaction, plugins, isOldProduct } =  this.props;
		const { modifiedFields, isLoading, validates, disabled, quantityRefunded } = this.state;
		const doesPriceWithoutReductionExist = (product.priceWithoutReduction != null && !isNaN(product.priceWithoutReduction));
		const customized =  plugins.hsposproductcustomization && !Lodash.isEmpty(product.customizationDatas);
		return (
                <tr  className={classNames(
											'cart-product-' + product.idProduct,
											"return-order",
											{'product-highlight': highlightNewProduct},
											{'highlight-refund-product': !highlightNewProduct && validates.quantity == 'valid'},
											{'product-customized':  customized}
											)
								}
				>
                	{
						Lodash.isEmpty(product.imageUrl) ?
						null
						:
						<td className="product-image">
							<img  src={product.imageUrl} alt={product.name} title={product.name} />
						</td>
					}
                    <td className="text-left product-name">
                        {
                            parseInt(product.idProductAttribute) > 0 ?
                                <a href="javascript:void(0);">
                                    {product.name}
                                    <span className="product-info">{product.productInfo}</span>
                                    <span className="combination-info">{product.shortCombination}</span>
                                </a>
                            :
                            	<p>
                            		{product.name}
                            		<span className="product-info">{product.productInfo}&nbsp;</span>
                            	</p>


                        }
                        {
							customized ?
							<a className="customize" href="javascript:void(0);"  onClick={this.showCustomizationPopup.bind(this)}>{lang.customization}</a>
							:
							null
						}
                    </td>
                        <td className="qty">
                                <div className="input-group">
                                    <input
                                        type='text'
                                        size='3'
                                        name='quantity'
                                        className={classNames('qty', validates.quantity, {disabled: customized})}
                                        type="text"
                                        defaultValue={0}
                                        onClick={this.onClick}
                                        onBlur={this.onSubmit.bind(this)}
                                        onChange= {this.handleChangeQuantityRefunded.bind(this)}
										disabled={customized}
                                    />
                                    <div className="input-group-addon">/&nbsp;{product.quantity}</div>
                                </div>
                        </td>
                    <td className={classNames('unit-price', {'input-block': doesPriceWithoutReductionExist})}>
                        {
                                <span>
                                    {
                                        doesPriceWithoutReductionExist ?
                                            <span className="old-price-return-transaction">{Utility.displayPrice(product.priceWithoutReduction, currency, false)}</span>
                                        :
                                            null
                                    }
                                </span>
                        }
                        <span>{Utility.displayPrice(modifiedFields.priceWithReduction, currency, false)}</span>
                    </td>
                    <td className="discount">
                        <span>{modifiedFields.reduction}</span>
                    </td>
                    <td className="text-right total">{Utility.displayPrice(product.total, currency, false)}</td>
                    <td>&nbsp;</td>
                </tr>
            )
    }
	render(){
		const { product, dispatch, lang, currency, highlightNewProduct, returnOrder, plugins } =  this.props;
		const { modifiedFields, isLoading, validates, disabled } = this.state;
		const doesPriceWithoutReductionExist = (product.priceWithoutReduction != null && !isNaN(product.priceWithoutReduction));
		const customized =  plugins.hsposproductcustomization && !Lodash.isEmpty(product.customizationDatas);
		if(returnOrder && !highlightNewProduct) {
			return this.renderProductForReturnOrder();
		}
		return (
				<tr  className={classNames(
											'cart-product-' + product.idProduct,
											{'product-highlight': highlightNewProduct, 'product-customized' : customized},
											{'product-customized':  customized}
											)
								}
				>
                {
					Lodash.isEmpty(product.imageUrl) ?
					null
					:
					<td className="product-image">
						<img  src={product.imageUrl} alt={product.name} title={product.name} />
					</td>
				}
					<td className="text-left product-name">
					{
						parseInt(product.idProductAttribute) > 0 ?
							<a href="javascript:void(0);" onClick={this.showChangeCombinationPopup.bind(this, product)}>
								{product.name}
								<span className="product-info">{product.productInfo}</span>
								<span className="combination-info">{product.shortCombination}&nbsp;<i className="fa fa-caret-down" aria-hidden="true"></i></span>
							</a>
						:
							<p>
								{product.name}
								<span className="product-info">{product.productInfo}</span>
							</p>
					}
					{
						plugins.hsposproductcustomization && product.customizationFields && (!Lodash.isEmpty(product.customizationFields.imageFields) || !Lodash.isEmpty(product.customizationFields.textFields)) ?
						<a className="customize" title={customized ? lang.update_customization : lang.add_customization_data }  href="javascript:void(0);"  onClick={this.showCustomizationPopup.bind(this)}>{lang.customize}</a>
						:
						null
					}
					</td>
					<td className="qty">
						{
							(isLoading && validates.quantity == 'valid')?
								<Loading inline = {true} />
								:
								<input
									type='text'
									size='3'
									name='quantity'
									className={classNames('qty', validates.quantity, {['single-qty'] : returnOrder})}
									type="text"
									value={modifiedFields.quantity}
									onClick={this.onClick}
									onChange= {this.handleChange.bind(this)}
									onKeyDown={this.onKeyDown.bind(this)}
									onMouseLeave={this.onSubmit.bind(this)}
									onBlur={this.onSubmit.bind(this)}
								/>
						}
						<span className="text-info">{modifiedFields.quantity}</span>
					</td>

					<td className={classNames('unit-price', {'input-block': doesPriceWithoutReductionExist})}>
						{
							(isLoading && validates.priceWithReduction == 'valid')?
								<div className="text-center"><Loading inline = {true} /></div>
								:
								<span>
									{
										doesPriceWithoutReductionExist ?
											<span className="old-price">{Utility.displayPrice(product.priceWithoutReduction, currency, false)}</span>
										:
											null
									}
									<input
										type='text'
										size='5'
										name='priceWithReduction'
										className={classNames('unit-price', validates.priceWithReduction, {disabled: disabled.priceWithReduction})}
										value={modifiedFields.priceWithReduction}
										onClick={this.onClick}
										onChange={this.handleChange.bind(this)}
										onKeyDown={this.onKeyDown.bind(this)}
										onMouseLeave={this.onSubmit.bind(this)}
										onBlur={this.onSubmit.bind(this)}
									/>
								</span>
						}
						<span className="text-info">{modifiedFields.priceWithReduction}</span>
					</td>
					<td className="discount">
						{
							(isLoading && validates.reduction == 'valid' )?
								<Loading inline = {true} />
								:
								<input
									type='text'
									size='3'
									name='reduction'
									className={classNames('discount', validates.reduction, {disabled: disabled.reduction})}
									value={modifiedFields.reduction}
									onClick={this.onClick}
									onChange={this.handleChange.bind(this)}
									onKeyDown={this.onKeyDown.bind(this)}
									onMouseLeave={this.onSubmit.bind(this)}
									onBlur={this.onSubmit.bind(this)}
								/>
						}
						<span className="text-info">{modifiedFields.reduction}</span>
					</td>
					<td className="text-right total">{Utility.displayPrice(product.total, currency, false)}</td>
					<td className="text-center">
						<a tabIndex="-1" onClick={() => {confirm(lang.do_you_want_to_delete_this_item) ? dispatch(deleteProduct(product.idProduct, product.idProductAttribute, product.idCustomization)): ''}} href="javascript:void(0);" title={lang.delete_this_item} className="delete">x</a>
					</td>
				</tr>
			)
	}
}

Product.propTypes = {
	lang: PropTypes.object.isRequired,
	product: PropTypes.object.isRequired, // shape(shapes->Product)
	dispatch: PropTypes.func,
	currency: PropTypes.object, // shape(shapes->Currency),
	  highlightNewProduct: PropTypes.bool,
	  order: PropTypes.object, // shape(shapes->Order)
}
