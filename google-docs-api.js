import axios from 'axios';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import VueGoogleApi from 'vue-google-api';

const config = {
  apiKey: '',
  clientId: '',
  scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/userinfo.profile',
  discoveryDocs: [ 'https://docs.googleapis.com/$discovery/rest?version=v1' ]
}

Vue.use(VueGoogleApi, config);


import { jsonDummyMixin } from '../mixins/json-dummy-data.js';

export const googleDocsApiMixin = {
	mixins: [
		jsonDummyMixin
	],
	data: function() {
		return {
			workingDocument: {
				docData: "",
			},
			lists: {
				serialNumbers: {
					ol: ['kix.h6umcx5o14o'],
					ul: ['kix.vtjxk1s6ilih'],
				},
				currentType: null
			}
		}
	},
	computed: {

    },
    watch: {

    },
    mounted() {

	},
    methods: {
    	getGoogleDoc() {
    		this.parseGoogleDoc();
		},

    	parseGoogleDoc() {
			this.workingDocument.docData = "";

			this.dummyData.body.content.forEach(contentNode => {
				if(typeof contentNode.paragraph != 'undefined') {
					// line can contain multiple elements
					let line = "";

					//check for closing list tag
					if(this.lists.currentType && typeof contentNode.paragraph.bullet == 'undefined') {
						line += `</${this.lists.currentType}>`;

						this.lists.currentType = null;
					}

					contentNode.paragraph.elements.forEach(elementNode => {
						line += elementNode.textRun.content.replaceAll(/\n$/gi, '<br />');

						//detect markup
						if(typeof elementNode.textRun.textStyle != 'undefined') {
							//loop through markup
							for(let style of Object.keys(elementNode.textRun.textStyle)) {
								switch(style) {
									case 'bold':
										line = `<strong>${line}</strong>`;
										break;

									case 'italic':
										line = `<em>${line}</em>`;
										break;

									case 'underline':
										line = `<u>${line}</u>`;
										break;

									case 'foregroundColor':
										let red = 0;
										let green = 0;
										let blue = 0;

										for(let color of Object.keys(elementNode.textRun.textStyle.foregroundColor.color.rgbColor)) {
											switch(color) {
												case 'red':
													red = Math.floor(elementNode.textRun.textStyle.foregroundColor.color.rgbColor.red * 100, 2);
													break;

												case 'green':
													green = Math.floor(elementNode.textRun.textStyle.foregroundColor.color.rgbColor.green * 100, 2);
													break;

												case 'blue':
													blue = Math.floor(elementNode.textRun.textStyle.foregroundColor.color.rgbColor.blue * 100, 2);
													break;
											}
										}

										line = `<span style='color: rgb(${red}%, ${green}%, ${blue}%)'>${line}</span>`;
										break;
								}
							}
						}
					}); //end element

					this.workingDocument.docData += (typeof contentNode.paragraph.bullet != 'undefined') ? this.wrapListTags(contentNode.paragraph.bullet, line) : line;
					this.cleanTagsImport();

				} //end paragraph
			});
    	},

    	wrapListTags(bulletNode, line) {
    		let newLine = '';

    		//opening list tag needed?
    		if(this.lists.currentType == null) {
    			this.lists.currentType = (this.lists.serialNumbers.ul.includes(bulletNode.listId)) ? 'ul' : 'ol';
    			newLine = `<${this.lists.currentType}>`;
    		}

    		return newLine += `<li>${line}</li>`;
    	},

    	cleanTagsImport() {
    		//when ul & ol lists are converted they add an extra line break to end of <li> tag
    		this.workingDocument.docData = this.workingDocument.docData.replaceAll('<br /></li>', '</li>');


    	}
	}
}