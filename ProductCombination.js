import React, { Component, PropTypes } from 'react'
import Lodash from 'lodash'
import Loading from './Loading'

export default class ProductCombination extends Component {
	constructor() {
    	super(...arguments);
        this.state = {
          	showLoading: false
        }
    }

	onMouseOver(idProductAttribute){
		this.props.onMouseOver(parseInt(idProductAttribute))
	}
	onClick(idProductAttribute){
	 	this.setState({
            showLoading: true
        })
		this.props.onChangeCombination(parseInt(idProductAttribute), this)
	}
	hideLoading(){
		this.setState({
            showLoading: false
        })
	}
	
	render(){
		const { attributes, lang, idProductAttribute , disabledClick} = this.props		
		let attributeListContent = [];
		Object.keys(attributes['attributes']).forEach(function(key){
			if (attributes['attributes'][key]['idAttribute'] == 0) {
				attributeListContent.push(<td>--</td>)
			} else {
				attributeListContent.push(<td>{attributes['attributes'][key]['value']}</td>)
			}
		})
		let actionColumn = '';	
		const classNameActions = ['change-to-this']
		if (disabledClick) {
			classNameActions.push('disabled')
		}	
		if (this.state.showLoading) {
			actionColumn = <td className="text-right action"><Loading inline={true} /></td>
		}else if (attributes['isDefault']) {
			actionColumn = <td className="text-right action">{lang.in_shopping_cart}</td>
		} else {
			actionColumn =  <td className="text-right action">
								<a className={classNameActions.join(' ')} onClick={this.onClick.bind(this, idProductAttribute)} href="javascript:void(0)">
									{lang.change_to_this}
								</a>
							</td>
		}

		return (<tr className = { attributes['isDefault'] ? 'selected' : null} onMouseOver={this.onMouseOver.bind(this, idProductAttribute)}>
					{attributeListContent}
					{actionColumn}
				</tr>)
	}
}

ProductCombination.propTypes = {
  	lang: PropTypes.object.isRequired,
  	attributes: PropTypes.array.isRequired, // shape(shapes->AttributeItem)
  	idProductAttribute: PropTypes.number.isRequired,
  	disabledClick: PropTypes.bool.isRequired,
  	onChangeCombination: PropTypes.func.isRequired,
}
