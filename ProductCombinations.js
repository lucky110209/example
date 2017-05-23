import React, { Component, PropTypes } from 'react'
import NewsalePopup from './NewsalePopup'
import ProductCombination from './ProductCombination'
import {changeCombination} from '../actions/products.actions'
import Lodash from 'lodash'
import Loading from './Loading'
import stringify from 'json-stable-stringify'
import Notification from './Notification'

export default class ProductCombinations extends NewsalePopup {

	constructor() {
    	super(...arguments);
        this.state = {
        	disabledClick: false,
        	productCombination: {},
            notification: {
                show: false,
          	}  
        }
    }

	getAttributes(product, combinations, groupNames){
		let attributesList = {};
		for (let i in combinations){
			attributesList[i] = {isDefault: false, attributes: {}}
			Object.keys(groupNames).forEach(function(key){
				if (typeof combinations[i]['attributes'][groupNames[key]['key']] !== 'undefined') {
					attributesList[i]['attributes'][key]  = combinations[i]['attributes'][groupNames[key]['key']];
				} else {
					attributesList[i]['attributes'][key]  = {
						color: '',
						groupName: groupNames[key]['name'],
						idAttribute: 0,
						image: '',
						position: groupNames[key]['position'],
						value: ''
					}
				}
			})

			attributesList[i]['isDefault'] = (parseInt(product.idProductAttribute) == i) 
		}
		return attributesList
	}

	getGroupNames(combinations){
		let groupNames = {}
		for (let idProductAttribute in combinations) {
			for(let key in combinations[idProductAttribute]['attributes']) {
				if (typeof Lodash.find(groupNames, function(o) { return stringify(o) ==  stringify({ [key]: []})}) == 'undefined') {
					groupNames[key] = {
										name: combinations[idProductAttribute]['attributes'][key]['groupName'],
										position: combinations[idProductAttribute]['attributes'][key]['position'],
										key: key
									 }
				}
			}

		}
		return Lodash.sortBy(groupNames, function(Group) {
			return Group['position'];
		})

	}

	onChangeCombination(newIdProductAttribute, ProductCombination){
		this.setState({
			disabledClick: true,
			productCombination: ProductCombination,
          	notification: {
	            show: false,
          	}   
      	})			
		this.props.dispatch(changeCombination(this.props.product.idProduct, this.props.product.idProductAttribute, newIdProductAttribute, this.onSuccess.bind(this), this.onError.bind(this)))
	}	
	
	onError(message) {
        this.setState({
        	disabledClick: false,
            notification:{
                show: true,
                isFetching: false,
                error: message
            }   
        });  
        this.state.productCombination.hideLoading();
	}
	render(){
		const { hasCombination, lang, combinations, product, onMouseOver, onMouseLeave } = this.props
		if (!hasCombination) {
			return null;
		}
		let groupNames = this.getGroupNames(combinations)
		if (Lodash.isEmpty(groupNames)) {
			return <Loading />;
		}
		let headerColumns = [];
		Object.keys(groupNames).forEach(function(key){
			headerColumns.push(<th>{groupNames[key]['name']}</th>);
		})

		let attributes = this.getAttributes(product, combinations, groupNames);
		let combinationList = [];
		const onChangeCombination = this.onChangeCombination.bind(this)	
		const disabledClick = this.state.disabledClick
		Object.keys(attributes).forEach(function(key){
			combinationList.push(<ProductCombination
									disabledClick = {disabledClick}
									onChangeCombination={onChangeCombination} 
									idProductAttribute = {key} 
									lang={lang} 
									attributes={attributes[key]} 
									onMouseOver={onMouseOver}									
									/>)
		})
		return (				
				<div className="combination">
						<Notification notification={this.state.notification}/>
						<table className="bordered-row" onMouseLeave={onMouseLeave}>
							<thead>
								<tr>
									{headerColumns}
									<th>&nbsp;</th>
								</tr>
							</thead>
							<tbody>
								{combinationList}
							</tbody>
						</table>
				</div>
			)
	}
}

ProductCombinations.propTypes = {
  	lang: PropTypes.object.isRequired,
  	combinations: PropTypes.array.isRequired, // shape(shapes->Combination)
	hasCombination: PropTypes.bool,
	product: PropTypes.object.isRequired, // shape(shapes->Product)
	onMouseOver: PropTypes.func,
	onMouseLeave: PropTypes.func 
}
