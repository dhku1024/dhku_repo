sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat"
], function(Controller, JSONModel, MessageToast, DateFormat) {
	"use strict";

	return Controller.extend("sap.ui.table.sample.TableFreeze.Controller", {

		onInit : function () {
			// set explored app's demo model on this sample
			var oJSONModel = this.initSampleDataModel();
			this.getView().setModel(oJSONModel);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},

		initSampleDataModel : function() {
			var oModel = new JSONModel();

			jQuery.ajax(jQuery.sap.getResourcePath('sap/ui/demo/mock') + '/order.json', {
				dataType: "json",
				success: function (oData) {
					console.log(oData);
					oModel.setData(oData);
				},
				error: function () {
					jQuery.sap.log.error("failed to load json");
				}
			});

			return oModel;
		},

		formatAvailableToObjectState : function (bAvailable) {
			return bAvailable ? "Success" : "Error";
		},

		formatAvailableToIcon : function(bAvailable) {
			return bAvailable ? "sap-icon://accept" : "sap-icon://decline";
		},

		handleDetailsPress : function(oEvent) {
			MessageToast.show("Details for product with id " + this.getView().getModel().getProperty("ProductId", oEvent.getSource().getBindingContext()));
		},

		buttonPress : function (oEvent) {
			var oView = this.getView(),
				oTable = oView.byId("table1"),
				sColumnCount = oView.byId("inputColumn").getValue() || 0,
				sRowCount = oView.byId("inputRow").getValue() || 0,
				sBottomRowCount = oView.byId("inputButtomRow").getValue() || 0,
				iColumnCount = parseInt(sColumnCount,10),
				iRowCount = parseInt(sRowCount,10),
				iBottomRowCount = parseInt(sBottomRowCount,10),
				iTotalColumnCount = oTable.getColumns().length,
				iTotalRowCount = oTable.getRows().length;

			// Fixed column count exceeds the total column count
			if (iColumnCount > iTotalColumnCount) {
				iColumnCount = iTotalColumnCount;
				oView.byId("inputColumn").setValue(iTotalColumnCount);
				MessageToast.show("Fixed column count exceeds the total column count. Value in column count input got updated.");
			}

			// Sum of fixed row count and bottom row count exceeds the total row count
			if (iRowCount + iBottomRowCount > iTotalRowCount) {

				if ((iRowCount < iTotalRowCount) && (iBottomRowCount < iTotalRowCount)) {
					// both row count and bottom count smaller than total row count
					iBottomRowCount = 1;
				} else if ((iRowCount > iTotalRowCount) && (iBottomRowCount < iTotalRowCount)) {
					// row count exceeds total row count
					iRowCount = iTotalRowCount - iBottomRowCount - 1;
				} else if ((iRowCount < iTotalRowCount) && (iBottomRowCount > iTotalRowCount)) {
					// bottom row count exceeds total row count
					iBottomRowCount = iTotalRowCount - iRowCount - 1;
				} else {
					// both row count and bottom count exceed total row count
					iRowCount = 1;
					iBottomRowCount = 1;
				}

				// update inputs
				oView.byId("inputRow").setValue(iRowCount);
				oView.byId("inputButtomRow").setValue(iBottomRowCount);
				MessageToast.show("Sum of fixed row count and buttom row count exceeds the total row count. Input values got updated.");
			}

			oTable.setFixedColumnCount(iColumnCount);
			oTable.setFixedRowCount(iRowCount);
			oTable.setFixedBottomRowCount(iBottomRowCount);
		}

	});

});

// Excel Export Code
/**
 * extend sap.m.Table
 */
sap.ui.define([
    'sap/ui/thirdparty/jquery',
    'sap/m/library',
    'sap/m/ListBase', 
    'sap/m/Table', 
	'sap/m/TableRenderer',
	'sap/m/MenuButton',
	'sap/m/Menu',
	'sap/m/MenuItem',
	'sap/ui/comp/personalization/Controller'
], function(jQuery, MLibrary, ListBase, Table, TableRenderer, MenuButton, Menu, MenuItem, PController) {
    'use strict';
    
    var oTable = Table.extend('custom.Table', {
        metadata: {
            properties: {
				itemPath 			: { type: 'string', 	group: 'Appearance',	defaultValue: null }, 
				itemCell 			: { type: 'object', 	group: 'Appearance',	defaultValue: null },
				usePersoController	: { type: 'boolean', 	group: 'Personalize',	defaultValue: false },							//개인화 설정 사용 여부
				persoPanels			: { type: 'string',		group: 'Personalize',	defaultValue: null },							//사용하고자 하는 옵션 설정
				persoData			: { type: 'object', 	group: 'Personalize',	defaultValue: null },							//저장된 개인화 데이터를 초기설정 할때사용 (JSON Data, 또는 JSON Data를 리턴할 Function)
				persoIcon			: { type: 'string',		group: 'Personalize',	defaultValue: 'sap-icon://action-settings' },	//사용하고자 하는 옵션 설정
				persoText			: { type: 'string',		group: 'Personalize',	defaultValue: undefined },						//사용하고자 하는 옵션 설정
				useExportToExcel	: { type: 'boolean', 	group: 'ExportExcel',	defaultValue: false },							//엑셀 익스포트 사용 여부
				exportExcelIcon		: { type: 'string',		group: 'ExportExcel',	defaultValue: 'sap-icon://download' },			//엑셀 익스포트 아이콘
				exportExcelText		: { type: 'string', 	group: 'ExportExcel',	defaultValue: '' },								//엑셀 익스포트 텍스트
				exportExcelFileName	: { type: 'string', 	group: 'ExportExcel',	defaultValue: '' }								//엑셀 익스포트 파일명
            },
            
            events: {
				savePersoData: {
					parameters: {
						columnInfo: { type: 'object' }
					}
				},
				afterFiltering: {
					parameters: {
						filterItems: { type: 'array' },
						filterResult: { type: 'array' },
					}
				}
			}
        },

        renderer: TableRenderer,

        constructor: function() {
			ListBase.apply(this, arguments);
			var _self = this;
			
			this._setP13nColumnData();

			{//테이블 헤더 영역 설정
				var oToolbar = this.getHeaderToolbar();
				this._oToolbar = oToolbar;
			 
				if(this.getUseExportToExcel()) { // 엑셀 익스포트 설정
					if(!oToolbar) {
						this._createToolbar();
					}
					this._addExportToExcelToToolbar();
					
					// 엑셀 기본 파일명 설정
					let sFileName = this.getExportExcelFileName();
					if(!sFileName) {
						let oDateInstance = sap.ui.core.format.DateFormat.getDateInstance({pattern: 'yyyyMMddHHmmss'});
						sFileName = 'Export_' + oDateInstance.format(new Date());
						this.setExportExcelFileName(sFileName);
					}
				}
			 
				if ( this.getUsePersoController() ) { // 개인화 설정
					// jQuery.sap.require('sap.ui.comp.personalization.Controller');
				 	var oButton = MF.button({
						icon: this.getPersoIcon(),
					 	text: this.getPersoText(),
					 	press: function(oEvent) {
							var oPersoController = _self._oPersoController;
						 	if ( oPersoController ) oPersoController.openDialog();
					 	}
				 	});

				 	if ( oToolbar ) {
						var bExistToolbarspacer = false;
						jQuery.each(oToolbar.getContent(), function(index, oControl) {
							if ( oControl instanceof sap.m.ToolbarSpacer ) bExistToolbarspacer = true; 
					 	});
					 	if ( !bExistToolbarspacer ) oToolbar.addContent(MF.toolbarSpacer());
					 	oToolbar.addContent(oButton);
				 	} else {
						oToolbar = MF.toolbar({
							content : [
								MF.toolbarSpacer(),
								oButton
						 	]
					 	})
				 	}
				}
				
				//this.setHeaderToolbar(oToolbar);
				
//				var oColumns = this.getColumns(), oPanels = _self.getPersoPanels();
//				var oPanelSetting = {};
//				oPanelSetting['columns']	= { visible: (!oPanels || (jQuery.type(oPanels) === 'string' && oPanels.indexOf(custom.PersoPanel.Column)	> -1)) };
//				oPanelSetting['sort']		= { visible: (!oPanels || (jQuery.type(oPanels) === 'string' && oPanels.indexOf(custom.PersoPanel.Sort)	> -1)) };
//				oPanelSetting['filter']		= { visible: (!oPanels || (jQuery.type(oPanels) === 'string' && oPanels.indexOf(custom.PersoPanel.Filter)	> -1)) };
//				oPanelSetting['group']		= { visible: (!oPanels || (jQuery.type(oPanels) === 'string' && oPanels.indexOf(custom.PersoPanel.Group)	> -1)) };
//				
//				this._persoUtil = sap.ui.comp.personalization.Util;
//			 	this._getPersoColumn = function(columnKey, columns) {
//					var oResultColumn = null;
//				 	columns.some(function(oColumn) {
//						if ( this._persoUtil.getColumnKey(oColumn) === columnKey ) {
//							oResultColumn = oColumn;
//						 	return true;
//					 	}
//				 	}, this);
//					 
//					return oResultColumn;
//			 	};
//
//			 	this._fnDefaultSortCompare = function(oColumn) {
//					var valueA, valueB, fnSort;
//				 	switch ( oColumn.getValueType() ) {
//					case custom.ValueType.Numeric: {
//						fnSort = function(a, b) {
//							if ( a === b ) return 0;
//							if ( b !== 0 && !b ) return -1;
//							if ( a !== 0 && !a ) return 1;
//							valueA = jQuery.type(a) === 'string' ? a.replace(/,/gi,'') : a, valueB = jQuery.type(b) === 'string' ? b.replace(/,/gi,'') : b; 
//							
//							return (parseFloat(valueA) > parseFloat(valueB)) ? 1 : ((parseFloat(valueA) < parseFloat(valueB)) ? -1 : 0);
//						 };
//					} break;
////						case bpf.ValueType.Date : {
////						}break;
//					default: {
//						fnSort = function(a, b) {
//							if ( a === b ) return 0;
//							if ( !b ) return -1;
//							if ( !a ) return 1;
//							
//							return (a.toLowerCase() > b.toLowerCase()) ? 1 : ((a.toLowerCase() < b.toLowerCase()) ? -1 : 0);
//						 };
//					} break;
//				 	};
//				
//					return fnSort;
//				};
//				 
//			 	setTimeout(function(){
//					_self._oPersoController = new PController({
//						table: _self,
//						setting: oPanelSetting,
//					 	afterP13nModelDataChange: function(oEvent) {
//							var oPersData = oEvent.getParameter('persistentData');
//						 	var oChangeData = oEvent.getParameter('changeData');
//						 	var oChangeType = oEvent.getParameter('changeType');
//						 	var oTable = oEvent.oSource.getTable();
//						 	var columns = oTable.getColumns();
//						 	var oBinding = oTable instanceof sap.m.Table ? oTable.getBinding('items') : oTable.getBinding('rows');
// 
//						 	//컬럼 변경 이벤트
//						 	if ( this._oPersistentDataBeforeOpen && this._oPersistentDataBeforeOpen.columns &&
//								 oChangeType && (oChangeType.columns === 'TableChanged' || oChangeType.columns === 'ModelChanged') ) {
//								
//								var tableColumnsInfo;
//							 	if ( this.getModel() && this.getModel().getProperty('/persistentData') ) {
//									tableColumnsInfo = jQuery.extend(true, {}, this.getModel().getProperty('/persistentData/columns'));
//							 	}
//							 
//								if ( tableColumnsInfo ) {
//									_self.fireSavePersoData({
//										columnInfo: {
//											columns: tableColumnsInfo
//										}
//									});
//								};
//						 	}
//						 
//						 	if ( oChangeData.group || oChangeData.sort ) {
//								var sorters = [];
//							 	if ( oPersData.group && oPersData.group.groupItems ) {
//									oPersData.group.groupItems.some(function(oModelItem) {
//										var oColumn = oTable._getPersoColumn(oModelItem.columnKey, columns);
//									 	var columnKey = oTable._persoUtil.getColumnKey(oColumn);
//									 	var bDescending = oModelItem.operation === sap.m.P13nConditionOperation.GroupDescending;
//									 	var fnGroup = oColumn.getGroup() || function(oContext) {
//											var columnText = oColumn.getHeader().getText();
//											var key = oContext.getProperty(columnKey);
//										
//											return {
//												key: key,
//												text: columnText + ' : ' + key
//											};
//										};
//										 
//									 	sorters.push(new sap.ui.model.Sorter(columnKey, bDescending, fnGroup, (oColumn.getSortCompare() || _self._fnDefaultSortCompare(oColumn))));
//										 
//										return true;
//								 	}, this);
//							 	}
//							 	if ( oPersData.sort && oPersData.sort.sortItems ) {
//									var fGetSorterByPath = function(sorters, columnKey) {
//										var oFoundSorter;
//										sorters.some(function(oSorter) {
//											if ( oSorter.sPath === columnKey ) {
//												oFoundSorter = oSorter;
//											
//												return true;
//											}
//										}, true);
//
//										return oFoundSorter;
//									};
//									oPersData.sort.sortItems.forEach(function(oSortItem) {
//										var oColumn = oTable._getPersoColumn(oSortItem.columnKey, columns);
//										var columnKey = oTable._persoUtil.getColumnKey(oColumn);
//										var bDescending = oSortItem.operation === sap.m.P13nConditionOperation.Descending;
//										var oSorter = fGetSorterByPath(sorters, columnKey);
//										if ( oSorter ) {
//											oSorter.bDescending = bDescending;
//										} else {
//											sorters.push(new sap.ui.model.Sorter(columnKey, bDescending, undefined, (oColumn.getSortCompare() || _self._fnDefaultSortCompare(oColumn))));
//										}
//									}, this);
//							 	}
//								oBinding.sort(sorters);
//						 	}
//						 	if ( oChangeData.filter ) {
//								if ( oChangeData.filter.filterItems.length > 0 ) {
//									var filters = new sap.ui.model.Filter({and: true, filters: []}),
//										includeFilter = new sap.ui.model.Filter({and: false, filters: []}), 
//									 	excludeFilter = new sap.ui.model.Filter({and: true, filters: []}); 
//								
//									oChangeData.filter.filterItems.forEach(function(oModelItem) {
//										var oColumn = oTable._getPersoColumn(oModelItem.columnKey, columns);
//										var columnKey = oTable._persoUtil.getColumnKey(oColumn);
//										if ( !oModelItem.exclude ) {
//											includeFilter['aFilters'].push(new sap.ui.model.Filter(columnKey, oModelItem.operation, oModelItem.value1, oModelItem.value2));
//										} else {
//											excludeFilter['aFilters'].push(new sap.ui.model.Filter(columnKey, sap.ui.model.FilterOperator.NE, oModelItem.value1));
//										}
//									}, this);
//								 
//									if ( includeFilter['aFilters'].length > 0 ) filters['aFilters'].push(includeFilter);
//								 	if ( excludeFilter['aFilters'].length > 0 ) filters['aFilters'].push(excludeFilter);
//									 
//									oBinding.filter(filters);
//							 	} else {
//									oBinding.filter();
//							 	}
//							 
//								_self.fireAfterFiltering({
//									filterItems: oChangeData.filter.filterItems,
//								 	filterResult: oBinding.aIndices
//							 	});
//						 	}
//					 	}
//				 	});
//				 
//				 	var oPersoData = _self.getPersoData();
//				 	switch ( jQuery.type(oPersoData) ) {
//					case 'object': _self._oPersoController.setPersonalizationData(oPersoData); break;
//					case 'function': _self._oPersoController.setPersonalizationData(oPersoData()); break;
//				 	}
//			 	}, 10);
			}
		}
	});
    
    oTable.prototype._setP13nColumnData = function() {
		if(this.getBindingInfo('items')) {
			let oColumns = this.getColumns();
			
			this.getBindingInfo('items').template.getAggregation('cells').forEach(function(oCell, index) {
				let sBindKey, sType, oBindingInfo;
				if(!oColumns[index].data('p13nData')) {
					if(oCell instanceof sap.m.Text || oCell instanceof sap.m.Link || oCell instanceof sap.m.ObjectStatus) {
						sBindKey = oCell.getBindingPath('text');
						oBindingInfo = oCell.getBindingInfo('text');
					} else if(oCell instanceof sap.m.Select || oCell instanceof sap.m.ComboBox) {
						sBindKey = oCell.getBindingPath('selectedKey');
						oBindingInfo = oCell.getBindingInfo('selectedKey');
					} else if(oCell instanceof sap.m.Input) {
						sBindKey = oCell.getBindingPath('value');
						oBindingInfo = oCell.getBindingInfo('value');
					} else if(oCell instanceof sap.m.CheckBox || oCell instanceof sap.m.RadioButton) {
						sBindKey = oCell.getBindingPath('selected');
						oBindingInfo = oCell.getBindingInfo('selected');
					} else if(oCell instanceof sap.m.RadioButtonGroup) {
						sBindKey = oCell.getBindingPath('selectedIndex');
						oBindingInfo = oCell.getBindingInfo('selectedIndex');
					} else {
						sBindKey = '';
					}
					
//					if(!sBindKey) {
//						throw (index + 1) + '번째 컬럼에 Binding 정보가 없습니다.';
//					}
					
					if(sBindKey) {
						if(oBindingInfo.parts && oBindingInfo.parts.length > 0) {
							sType = oBindingInfo.parts[0].type;
						}
					}
					
					oColumns[index].data('p13nData', {
						columnKey: sBindKey,
					 	sortProperty: sBindKey,
					 	filterProperty: sBindKey,
					 	leadingProperty: sBindKey,
					 	type: sType
					});
				}
			});
		}
    };
    
    oTable.prototype._createToolbar = function() {
    	if(this._oToolbar) {
    		let aContent = this._oToolbar.getContent(),
				bExistToolbarspacer = false;
    		
    		aContent.some(function(oContent) {
    			if(oControl instanceof sap.m.ToolbarSpacer) {
					bExistToolbarspacer = true;
					return true;
				}
    		});
		 	if(!bExistToolbarspacer) {
		 		this._oToolbar.addContent(new sap.m.ToolbarSpacer());
		 	}
	 	} else {
		 	this._oToolbar = new sap.m.Toolbar({
				content: [ new sap.m.ToolbarSpacer() ]
		 	})
	 	}
    	
    	this.setHeaderToolbar(this._oToolbar);
    };
    
    oTable.prototype._addExportToExcelToToolbar = function() {
    	if(this._oUseExportToExcel) {
    		this._oToolbar.removeContent(this._oUseExportToExcel);
    	}
    	if(this.getUseExportToExcel()) {
    		let sButtonLabel, sButtonId, sIconUrl, oMenuButton, oResourceBundle = sap.ui.getCore().getLibraryResourceBundle('sap.ui.comp');
    		if(!this._oUseExportToExcel) {
    			sButtonLabel = oResourceBundle.getText('TABLE_EXPORT_TEXT');
    			sButtonId = this.getId() + '-btnExcelExport';
    			sIconUrl = this.getExportExcelIcon();
    			
    			oMenuButton = new MenuButton(sButtonId, {
    				icon: sIconUrl,
    				tooltip: sButtonLabel,
    				type: MLibrary.ButtonType.Ghost,
    				buttonMode: MLibrary.MenuButtonMode.Split,
    				useDefaultActionOnly: true,
    				defaultAction: [
    					function() {
    						this._triggerUI5ClientExport();
    					}, this
    				],
    				menu: [
    					new Menu({
    						items: [
    							new MenuItem({
    								text: oResourceBundle.getText('QUICK_EXPORT'),
    								press: [
    									function() {
    										this._triggerUI5ClientExport();
    									}, this
    								]
    							}),
    							new MenuItem({
    								text: oResourceBundle.getText('EXPORT_WITH_SETTINGS'),
    								press: function() {
    									var oExportLibLoadPromise = this._loadExportLibrary();
    									oExportLibLoadPromise.then(function() {
    										sap.ui.require([
    											'sap/ui/export/ExportUtils'
    										], function(ExportUtils) {
    											var oCustomConfig = this._cachedExcelSettings || {
    												fileName: this.getExportExcelFileName()
    											},
    											
    											oExportSettingsDialogPromise = ExportUtils.openExportSettingsDialog(oCustomConfig, this);
    											oExportSettingsDialogPromise.then(function(oData) {
    												var oDialog = oData._oExportSettingsDialog,
    													sDialogId = oDialog.getId(),
    													aContent = oDialog.getContent();
    													
    												if(aContent.length > 0) {
    													let aItems = aContent[0].getItems();
    													if(aItems.length > 0) {
    														aItems.some(function(oItem) {
    															if(oItem.getId() === (sDialogId + '-includeFilterSettings')) {
    																oItem.setVisible(false);
    																return true;
    															}
    														});
    													}
    												}
    												
    												oData.getUserInput().then(function(oUserInput) {
    													if(oUserInput) {
    														this._cachedExcelSettings = oUserInput;
    														this._triggerUI5ClientExport(oUserInput);
    													}
    												}.bind(this));
    												
    												this._oExportSettingsDialog = oDialog;
    											}.bind(this));
    										}.bind(this));
    									}.bind(this));
    								}.bind(this)
    							})
    						]
    					})
    				]
    			});
    			
    			this._oUseExportToExcel = oMenuButton;
    		}
    		this._oToolbar.addContent(this._oUseExportToExcel);
    	}
    };
    
    oTable.prototype._loadExportLibrary = function() {
    	if(!this._oExportLibLoadPromise) {
    		this._oExportLibLoadPromise = sap.ui.getCore().loadLibrary('sap.ui.export', true);
    	}
    	
    	return this._oExportLibLoadPromise;
    };
    
    oTable.prototype._triggerUI5ClientExport = function(mCustomConfig, mFilterConfig) {
    	var oExportLibLoadPromise = this._loadExportLibrary();
    	oExportLibLoadPromise.then(function() {
    		var aColumns = this.getColumns(), i, iLen = aColumns.length, oColumn, oColumnData, sLabel, sPath, sTemplate, sHAlign, nWidth, sType, oType, inputFormat, aSheetColumns = [];
    		var bSplitCells = mCustomConfig && mCustomConfig.splitCells;
    		
    		aColumns = aColumns.sort(function(oCol1, oCol2) {
    			return oCol1.getOrder() - oCol2.getOrder();
    		});
    		for(i=0;i<iLen;i++) {
    			sPath = null;
    			sTemplate = null;
    			oColumn = aColumns[i];
    			if(oColumn.getVisible()) {
    				oColumnData = oColumn.data('p13nData');
    				if(!sPath && oColumnData) {
    					sPath = oColumnData.leadingProperty;
    				}
    				if(sPath) {
    					sLabel = this._getColumnLabel(oColumn);
    					nWidth = oColumn.getWidth().toLowerCase() || oColumnData.width || "";
    					sType = oColumnData.type === 'numeric' ? 'number' : oColumnData.type;
    					oType = null;
    					inputFormat = null;
    					
    					if(!sType) {
    						sType = 'string';
    					}
    					
    					aSheetColumns.push({
    						columnId: oColumn.getId(),
    						property: sTemplate ? [
    							sPath, oColumnData.description
    						] : sPath,
    						type: sType,
    						inputFormat: inputFormat,
    						label: sLabel ? sLabel : sPath,
    						width: nWidth,
    						textAlign: oColumn.getHAlign(),
    						template: sTemplate,
    						trueValue: undefined,
    						falseValue: undefined,
    						displayUnit: sType === 'currency' && !bSplitCells
    					});
    				}
    			}
    		}
    		
    		// If no columns exist, show message and return without exporting
    		if(!aSheetColumns || !aSheetColumns.length) {
    			MessageBox.error(sap.ui.getCore().getLibraryResourceBundle('sap.ui.comp').getText('SMARTTABLE_NO_COLS_EXPORT'), {
					styleClass: (this.$() && this.$().closest('.sapUiSizeCompact').length) ? 'sapUiSizeCompact' : ''
				});
				return;
    		}
    		
    		var oRowBinding = this.getBinding('items'),
    			sFileName = mCustomConfig ? mCustomConfig.fileName : this.getExportExcelFileName(),
    			iCount = this._getRowCount(true);
    			
    		sap.ui.require([
    			'sap/ui/export/Spreadsheet',
    			'sap/ui/export/ExportUtils'
    		], function(Spreadsheet, ExportUtils) {
    			var mExportSettings = {
					workbook: {
						columns: aSheetColumns,
						hierarchyLevel: undefined
					},
					dataSource: oRowBinding.oList,
					fileName: sFileName
				},
				mUserSettings = {
					splitCells: false,
					includeFilterSettings: false
				};
    			
				if(mCustomConfig) {
					mUserSettings.splitCells = mCustomConfig.splitCells;
					mUserSettings.includeFilterSettings = mCustomConfig.includeFilterSettings;
				}

				if (mFilterConfig) {
					mExportSettings.workbook.context = {
						metaSheetName: mFilterConfig.name,
						metainfo: [ mFilterConfig ]
					};
				}

				// Event to enable user modification of excel settings
				// user export settings are also provided to the application(일단 보류)
//				this.fireBeforeExport({
//					exportSettings: mExportSettings,
//					userExportSettings: mUserSettings
//				});

				var oSheet = new Spreadsheet(mExportSettings);
				// Replace Promise.finally with Promise.then to avoid Eclipse IDE formatting issue
				var fAfterSheetBuild = function() {
					this.destroy();
				}.bind(oSheet);
				oSheet.build().then(fAfterSheetBuild, fAfterSheetBuild);
    		}.bind(this));
    	}.bind(this));
    };
    
    oTable.prototype._getColumnLabel = function(oColumn) {
    	var oLabel;
    	
    	if(typeof oColumn === 'string') {
    		oColumn = this._getColumnByKey(oColumn);
    	}
    	
    	if(!oColumn) {
    		return null;
    	}
    	
    	if(oColumn.getLabel) {
    		oLabel = oColumn.getLabel();
    	}
    	
    	if(oColumn.getHeader) {
    		oLabel = oColumn.getHeader();
    	}
    	
    	return (oLabel && oLabel.getText) ? oLabel.getText() : null;
    };
    
    oTable.prototype._getColumnByKey = function(sColumnKey) {
    	var aColumns = this.getColumns(), oColumn, iLength = aColumns.length, i, oColumnData;
    	for(i=0;i<iLength;i++) {
    		oColumn = aColumns[i];
    		oColumnData = oColumn.data('p13Data');
    		if(oColumnData && oColumnData.columnKey === sColumnKey) {
    			break;
    		}
    	}
    	
    	return oColumn;
    };
    
    oTable.prototype._getRowCount = function(bConsiderTotal) {
		var oRowBinding = this.getBinding('items');

		if (!oRowBinding) {
			return 0;
		}

		var iRowCount = 0;
		if (bConsiderTotal && oRowBinding.getTotalSize) {
			iRowCount = oRowBinding.getTotalSize();
		} else {
			iRowCount = oRowBinding.getLength();
		}

		if (iRowCount < 0 || iRowCount === "0") {
			iRowCount = 0;
		}

		return iRowCount;
	};
	
	oTable.prototype._resetFilter = function() {
		var oBinding = this.getBinding('items'), oPersoModel, oPersistentData;
		if ( oBinding && oBinding.aFilters.length > 0 ) {
			if ( this._oPersoController ) {
				oPersoModel = this._oPersoController.getModel();
				if ( oPersoModel ) oPersoModel.setProperty('/persistentData/filter/filterItems', []);
				oPersistentData = this._oPersoController._oPersistentDataAlreadyKnown;
				if ( oPersistentData && oPersistentData.filter ) oPersistentData.filter.filterItems = [];
			}

			oBinding.filter();
		}
	};

    return oTable;
}, true);

// Perso Controller
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/table/TableGrouping",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/table/TableColumnUtils"
], function (jQuery, Controller, JSONModel, TableGrouping, Filter, Fragment, TableColumnUtils) {
    "use strict";
    
    return Controller.extend("SCMTMS_GEOMAP.fragment.Personalization", {
        onInit: function(oDialog, oTable) {
        	try {
        		if(!oDialog || !(oDialog instanceof sap.m.Dialog)) {
        			throw new Error("다이어로그 객체가 없거나, 올바른 객체 타입이 아닙니다.");
        		} else if(!oTable || !(oTable instanceof sap.ui.table.Table)) {
        			throw new Error("테이블 객체가 없거나, 올바른 객체 타입이 아닙니다.");
        		}
        	} catch(e) {
        		console.error(e);
        	}
        	
        	var oLayoutData = {
    			"bResetEnabled": false,
        		"columns": {"bEnabled": true, "bVisible": true},
        		"sort": {"bEnabled": true, "bVisible": true},
        		"filter": {"bEnabled": true, "bVisible": true},
        		"group": {"bEnabled": true, "bVisible": true}
        	};
        	
        	oDialog.addStyleClass(sap.ui.Device.system.desktop ? "sapUiSizeCompact" : "sapUiSizeCozy");
        	oDialog.setModel(new JSONModel(oLayoutData), "layoutModel");
        	oTable.addDependent(oDialog);
        	
        	this._oDialog = oDialog;
        	this._oTable = oTable;
        	//this._oInitPersoData = null;
        	this._oSavePersoData = null;
        	
        	// 저장된 테이블 개인화 정보를 불러온다.(구현예정)
        	this._getSavePersoData(function() {
        		this._setInitializeColumnItems();
        		this._oDialog.fireOk();
        	});
        	// 상단의 탭버튼(Columns, Sort, Filter, Group)에 대한 enabled, visible 모델 바인딩 처리
        	this._setLayoutDataOfNavItems();
        	// 컬럼 패널의 초기 이벤트 설정(컬럼 테이블 및 상단의 이동버튼)
        	this._setColumnsPanelTableEvents();
        	// 테이블 초기 설정
        	this._setTableSettings();
        	
        	// 사용자가 저장한 컬럼 순서가 유지 될 수 있도록 persistentIndex기준으로 재정렬
        	this._oDialog.getPanels()[0]._sortModelItemsByPersistentIndex = function(aModelItems) {
        		sap.m.P13nColumnsPanel.prototype._sortModelItemsByPersistentIndex.apply(this, arguments);
        		
        		aModelItems.sort(function(a, b) {
        			if(a.persistentIndex < b.persistentIndex) {
        				return -1;
        			}
        			if(a.persistentIndex > b.persistentIndex) {
        				return 1;
        			}
        			
        			return 0;
        		});
        	};
        },
        
        onBeforeOpen: function(oEvent) {
	    	this._setInitializeColumnItems();
	    	this._isChangedItems();
	    	this._checkGroupItem();
        },

        onChangeColumnsItems: function(oEvent) {
            var oPersoModel = this._oDialog.getModel("persoModel"),
                aCopyItem = $.extend(true, [], oEvent.getParameter("items")),
                aExistingItem = oEvent.getParameter("existingItems"),
                aNewColumnItem = [];
           
            aCopyItem.forEach(function(oCopyItem, iIndex) {
            	var oData = aExistingItem[iIndex].getBindingContext("persoModel").getObject();
            	
            	oCopyItem["columnId"] = oData["columnId"];
            	oCopyItem["columnName"] = oData["columnName"];
            	oCopyItem["sortProperty"] = oCopyItem["columnKey"];
            	oCopyItem["filterProperty"] = oCopyItem["columnKey"];
            	oCopyItem["index"] = iIndex;
            	oCopyItem["hAlign"] = oData["hAlign"];
            	oCopyItem["targetColumn"] = oData["targetColumn"];
            	oCopyItem["existMultiLabels"] = oData["existMultiLabels"];
            });

            oPersoModel.setProperty("/aColumnItem", aCopyItem);
            this._isChangedItems();
        },

        /**
         * Table Sort 처리
         */
        onChangeSortItem: function(oEvent) {
            var sEventId = oEvent.getId(),
                oPersoModel = this._oDialog.getModel("persoModel"),
                aSortItem = oPersoModel.getProperty("/aSortItem"),
                oSortItemData = oEvent.getParameter("sortItemData"),
                iIndex = oEvent.getParameter("index"),
                sColumnKey,
                sOperation;

            if(oSortItemData && sEventId === "addSortItem" || sEventId === "updateSortItem") {
                console.log(sEventId);
                sColumnKey = oSortItemData.getColumnKey();
                sOperation = oSortItemData.getOperation();

                aSortItem[iIndex] = {
                    columnKey: sColumnKey,
                    operation: sOperation
                };
            } else {
                aSortItem.splice(iIndex, 1);
            }

            oPersoModel.refresh(false);
            this._isChangedItems();
            console.log(oPersoModel.getProperty("/aSortItem"));
        },
        
        /**
         * Table Filter 처리
         */
        onChangeFilterItem: function(oEvent) {
        	var sReason = oEvent.getParameter("reason"),
            	oPersoModel = this._oDialog.getModel("persoModel"),
            	aFilterItem = oPersoModel.getProperty("/aFilterItem"),
            	oFilterItemData = oEvent.getParameter("itemData"),
            	iIndex = oEvent.getParameter("index"),
            	sColumnKey, bExclude, sOperation, sValue1, sValue2;
        	
        	console.log("index", oEvent.getParameter("index"));
        	console.log("itemData", oEvent.getParameter("itemData"));
        	
        	if(oFilterItemData && sReason === "added" || sReason === "updated") {
        		console.log(sReason);
        		sColumnKey = oFilterItemData.columnKey;
        		bExclude = oFilterItemData.exclude;
        		sOperation = oFilterItemData.operation;
        		sValue1 = oFilterItemData.value1;
        		sValue2 = oFilterItemData.value2;
        		
        		aFilterItem[iIndex] = {
        			columnKey: sColumnKey,
        			exclude: bExclude,
        			operation: sOperation,
        			value1: sValue1,
        			value2: sValue2
        		};
        	} else {
        		aFilterItem.splice(iIndex, 1);
        	}
        	
        	oPersoModel.refresh(false);
        	this._isChangedItems();
            console.log(oPersoModel.getProperty("/aFilterItem"));
        },

        /**
         * Table Grouping 처리
         */
        onChangeGroupItem: function(oEvent) {
            var sEventId = oEvent.getId(),
            	oLayoutModel = this._oDialog.getModel("layoutModel"),
            	oLayoutData = oLayoutModel.getProperty("/"),
                oPersoModel = this._oDialog.getModel("persoModel"),
                oPersoData = oPersoModel.getProperty("/"),
                aGroupItem = oPersoData.aGroupItem,
                oGroupItemData = oEvent.getParameter("groupItemData"),
                iIndex = oEvent.getParameter("index"),
                sColumnKey, sOperation, bShowIfGrouped;

            if(oGroupItemData && sEventId === "addGroupItem" || sEventId === "updateGroupItem") {
                sColumnKey = oGroupItemData.getColumnKey();
                sOperation = oGroupItemData.getOperation();
                bShowIfGrouped = oGroupItemData.getShowIfGrouped();

                aGroupItem[iIndex] = {
            		 columnKey: sColumnKey,
                     operation: sOperation,
                     showIfGrouped: bShowIfGrouped
                };
                
                // Grouping 설정시 Sort 및 Filter는 동작하지 않으므로 사용자가 선택할 수 없도록 막는다.
                // Grouping 설정시 Sort 및 Filter를 적용할시 스탠다드 내부적으로 버그가 많음.
                if(oPersoData.aSortItem.length > 0) {
                	oPersoData.aSortItem.splice(0);
                }
                if(oPersoData.aFilterItem.length > 0) {
                	oPersoData.aFilterItem.splice(0);
                }
                oLayoutData.sort.bEnabled = false;
                oLayoutData.filter.bEnabled = false;
            } else {
                aGroupItem.splice(iIndex, 1);
                oLayoutData.sort.bEnabled = true;
                oLayoutData.filter.bEnabled = true;
            }

            oLayoutModel.refresh(false);
            oPersoModel.refresh(false);
            this._isChangedItems();
            console.log(oPersoModel.getProperty("/aGroupItem"));
        },

        onOK: function(oEvent) {
            var oPersoModel = this._oDialog.getModel("persoModel"),
                oPersoData = oPersoModel.getProperty("/"),
                aColumnItem = oPersoData.aColumnItem,
                aCopyColumnItem = $.extend(true, [], aColumnItem),
                aSortItem = oPersoData.aSortItem,
                aFilterItem = oPersoData.aFilterItem,
                aGroupItem = oPersoData.aGroupItem,
                oTable = this._oTable,
                oTargetColumn;

            // column이동, visible처리
            oTable.removeAllColumns();
            aCopyColumnItem.forEach(function(oCopyColumnItem) {
                var oTargetColumn = oCopyColumnItem.targetColumn;

                oTargetColumn.setVisible(oCopyColumnItem.visible);
                oTable.addColumn(oTargetColumn);
                
                // 데이터 저장을 위해서 Column 객체는 제거
                delete oCopyColumnItem.targetColumn;
            });

            // Sort 처리
            if(aSortItem.length > 0) {
                aSortItem.forEach(function(oSortItem, iIndex) {
                    aColumnItem.some(function(oColumnItem) {
                        if(oColumnItem.columnKey === oSortItem.columnKey) {
                            oTargetColumn = oColumnItem.targetColumn;
                            return true;
                        }
                    });

                    if(iIndex > 0) {
                        oTable.sort(oTargetColumn, oSortItem.operation, true);
                    } else {
                        oTable.sort(oTargetColumn, oSortItem.operation, false);
                    }
                });
                //this._clearGrouping();
            } else {
                oTable.getBinding("rows").sort(null);
                aColumnItem.forEach(function(oColumnItem) {
                    oColumnItem.targetColumn.setSorted(false);
                });
            }
            
            // Filter 처리
            if(aFilterItem.length > 0) {
            	var aFilter = new Filter({"and": true, "filters": []}),
            		aIncludeFilter = new Filter({"and": false, "filters": []}),
            		aExcludeFilter = new Filter({"and": true, "filters": []});
            	
            	// filter 대상 컬럼을 재설정하기 위해 일단 모든 컬럼 filter 해제
            	aColumnItem.forEach(function(oColumnItem) {
                    oColumnItem.targetColumn.setFiltered(false);
                });
            	
            	aFilterItem.forEach(function(oFilterItem) {
            		var bExclude = oFilterItem.exclude;
            		
            		if(bExclude) {
            			aExcludeFilter["aFilters"].push(new Filter({
                			path: oFilterItem.columnKey,
                			operator: "NE",
                			value1: oFilterItem.value1
                		}));
            		} else {
            			aIncludeFilter["aFilters"].push(new Filter({
                			path: oFilterItem.columnKey,
                			operator: oFilterItem.operation,
                			value1: oFilterItem.value1,
                			value2: oFilterItem.value2
                		}));
            		}
            		
            		aColumnItem.some(function(oColumnItem) {
                        if(oColumnItem.columnKey === oFilterItem.columnKey) {
                            oTargetColumn = oColumnItem.targetColumn;
                            return true;
                        }
                    });
            		oTargetColumn.setFiltered(true);
            	});
            	
            	aFilter["aFilters"].push(aIncludeFilter);
            	aFilter["aFilters"].push(aExcludeFilter);
            	oTable.getBinding("rows").filter(aFilter);
            	//this._clearGrouping();
            } else {
            	oTable.getBinding("rows").filter(null);
            	aColumnItem.forEach(function(oColumnItem) {
                    oColumnItem.targetColumn.setFiltered(false);
                });
            }

            // Grouping 처리
            if(aGroupItem.length > 0 && oTable.getBinding("rows").oList.length > 0) {
                aColumnItem.some(function(oColumnItem) {
                    if(oColumnItem.columnKey === aGroupItem[0].columnKey) {
                        oTargetColumn = oColumnItem.targetColumn;
                        return true;
                    }
                });
                // 스탠다드 내부 버그로 인해 일단 Grouping 해제 후 재설정하기 위함.
                this._clearGrouping();
                oTargetColumn.setGrouped(true);
                oTable.setGroupBy(oTargetColumn);
            } else {
            	this._clearGrouping();
            }

            // 개인화 저장
            this._doSavePersoData({
				"aItem": oPersoData.aItem,
				"aColumnItem": aCopyColumnItem,
				"aSortItem": aSortItem,
				"aFilterItem": aFilterItem,
				"aGroupItem": aGroupItem // Grouping 정보는 개인화 저장대상에서 일단 제외(테이블 스탠다드 로직 점검 필요)
            });
            this._oDialog.close();
        },
        
        onCancel: function(oEvent) {
        	var oPersoModel = this._oDialog.getModel("persoModel"),
        		oSavePersoData = this._oSavePersoData;
        	
        	this._checkGroupItem();
        	oPersoModel.setProperty("/", $.extend(true, {}, oSavePersoData));
        	
        	if(oEvent.getId() === "cancel") {
        		this.onClose();	
        	}
        },

        onClose: function(oEvent) {
        	var oDialog = this._oDialog;
        	
        	oDialog.close();
        	//oDialog.destroy();
        },
        
    	/**
    	 * 저장된 테이블 개인화 정보가 있으면 개인화 정보 설정
    	 * 없으면 테이블 컬럼정보를 기준으로 새로운 정보 설정
    	 */
        _setInitializeColumnItems: function() {
         	var aColumn = this._oTable.getColumns(),
         		aItem = [],
	            aColumnItem = [];
        	
        	aColumn.forEach(function(oColumn, iColumnIndex) {
				var sColumnId = oColumn.getId(),
				    sColumnWidth = oColumn.getWidth(),
				    sColumnHAlign = oColumn.getHAlign(),
				    bColumnVisible = oColumn.getVisible(),
				    bExistMultiLabels = false,
				    aMultiLabel = oColumn.getMultiLabels(),
				    oItem = {"text": ""},
				    sColumnBindKey, sColumnName;
				
				// Multi Header 여부 체크
				if(aMultiLabel.length > 1) {
					bExistMultiLabels = true;
					sColumnName = aMultiLabel[aMultiLabel.length-1].getText();
				} else {
					if(aMultiLabel.length > 0) {
						sColumnName = aMultiLabel[0].getText();
					} else {
						sColumnName = oColumn.getAggregation("label").getText();
					}
				}
				
				oItem.text = sColumnName;
				this._getTemplateBindingInfo(oColumn, oItem);
				aItem.push(oItem);
				
				sColumnBindKey = oItem.columnKey;
				aColumnItem.push({
					"columnId": sColumnId,
					"columnName": sColumnName,
					"columnKey": sColumnBindKey,
					"sortProperty": sColumnBindKey,
					"filterProperty": sColumnBindKey,
					"index": iColumnIndex,
					"width": sColumnWidth,
					"hAlign": sColumnHAlign,
					"visible": bColumnVisible,
					"targetColumn": oColumn,
					"existMultiLabels": bExistMultiLabels
				});
				
				oColumn.setSortProperty(sColumnBindKey);
//				oColumn.attachColumnMenuOpen(function(oEvent) {
//					console.log(oEvent.getParameter("menu"));
//				});
	        }.bind(this));
        	
        	if(this._oSavePersoData) {
        		var aSaveItem = this._oSavePersoData.aItem,
        			aSaveColumnItem = this._oSavePersoData.aColumnItem,
        			bNotEqual = false;
        		
        		if(aItem.length !== aSaveItem.length) {
        			bNotEqual = true;
        		} else {
        			aSaveItem.some(function(oSaveItem) {
            			var aTargetItem = aItem.filter(function(oItem) {
            				return (oItem.text === oSaveItem.text || oItem.columnKey === oSaveItem.columnKey);
            			});
            			
            			if(aTargetItem.length === 0) {
            				bNotEqual = true;
            			}
            			
            			return bNotEqual;
            		});
        		}
        		
        		aSaveColumnItem.forEach(function(oSaveColumnItem) {
        			aColumnItem.some(function(oColumnItem) {
        				if(oColumnItem.columnKey === oSaveColumnItem.columnKey) {
        					oSaveColumnItem.targetColumn = oColumnItem.targetColumn;
        					return true;
        				}
        			});
        		});
        	}

        	// 현재 기준 테이블 컬럼 정보에 없는 데이터가 개인화 정보에 저장되어 있는 경우 컬럼 정보를 초기화
        	if(!this._oSavePersoData || bNotEqual) {
        		this._oSavePersoData = {
    				"aItem": aItem,
					"aColumnItem": aColumnItem,
					"aSortItem": [],
					"aFilterItem": [],
					"aGroupItem": []
    			};
        	}
        	
        	this._oDialog.setModel(new JSONModel($.extend(true, {}, this._oSavePersoData)), "persoModel");
        },
        
        /**
         * 상단의 탭버튼(Columns, Sort, Filter, Group)에 대한 enabled, visible 모델 바인딩 처리
         */
        _setLayoutDataOfNavItems: function() {
        	var aNavItem = this._oDialog.getSubHeader().getContentLeft()[0].getButtons();
        	
        	aNavItem.forEach(function(oNavItem) {
        		var sItemText = oNavItem.getText().toLowerCase();
        		oNavItem.bindProperty("enabled", {"path": "layoutModel>/" + sItemText + "/bEnabled"});
        		oNavItem.bindProperty("visible", {"path": "layoutModel>/" + sItemText + "/bVisible"});
        	});
        },
        
        /**
         * 
         */
        _setColumnsPanelTableEvents: function() {
        	var oP13nColumnsPanel = this._oDialog.getPanels()[0],
        		aObject = oP13nColumnsPanel.findAggregatedObjects(true, function(oChildObject) {
	        		return (oChildObject instanceof sap.m.Table || oChildObject instanceof sap.m.OverflowToolbar);
	        	}),
	        	fnGetColumnItems = function() {
        			return this._oDialog.getModel("persoModel").getProperty("/aColumnItem");
        		}.bind(this);
        	
        	if(aObject.length > 0) {
        		aObject.forEach(function(oChildObject) {
        			if(oChildObject instanceof sap.m.Table) {
        				oChildObject.addEventDelegate({
        					"onAfterRendering": function() {
        						var oModel = this.getModel(),
	                				aColumnItem = fnGetColumnItems(),
	                				oMarkedTableItem = oP13nColumnsPanel._getMarkedTableItem(),
	                				iIndex = oP13nColumnsPanel._getVisibleTableItems().indexOf(oMarkedTableItem),
	                				bExistMultiLabels = aColumnItem[iIndex].existMultiLabels;
        						
        						// 액티브된 컬럼 아이템이 Multi Header 대상 컬럼일 경우 컬럼이동 버튼 비활성화
        						if(bExistMultiLabels) {
        							oModel.setProperty("/isMoveUpButtonEnabled", false);
                    				oModel.setProperty("/isMoveDownButtonEnabled", false);
        						}
        					}
        				}, oChildObject);
        				
        				oChildObject.attachItemPress(function(oEvent) {
                			var oModel = oEvent.getSource().getModel(),
                				aColumnItem = fnGetColumnItems(),
                				oListItem = oEvent.getParameter("listItem"),
                				iIndex = oP13nColumnsPanel._getVisibleTableItems().indexOf(oListItem),
                				bExistMultiLabels = aColumnItem[iIndex].existMultiLabels;
                			
                			if(bExistMultiLabels) {
                				oModel.setProperty("/isMoveUpButtonEnabled", false);
                				oModel.setProperty("/isMoveDownButtonEnabled", false);
                			} else {
                				if(iIndex === 0) {
                					oModel.setProperty("/isMoveUpButtonEnabled", false);
                    				oModel.setProperty("/isMoveDownButtonEnabled", true);
                				} else if(iIndex === (aColumnItem.length-1)) {
                					oModel.setProperty("/isMoveUpButtonEnabled", true);
                    				oModel.setProperty("/isMoveDownButtonEnabled", false);
                				} else {
                					oModel.setProperty("/isMoveUpButtonEnabled", true);
                    				oModel.setProperty("/isMoveDownButtonEnabled", true);
                				}
                			}
                		}.bind(this));
        			} else if(oChildObject instanceof sap.m.OverflowToolbar) {
        				var aContent = oChildObject.getContent();
        				aContent.forEach(function(oContent) {
        					var sIconURI;
        					if(oContent instanceof sap.m.OverflowToolbarButton) {
        						sIconURI = oContent.getIcon();
        						if(sIconURI === "sap-icon://slim-arrow-up") {
        							oContent.mEventRegistry.press = null;
        							oContent.attachPress(function(oEvent) {
        								var aColumnItem = fnGetColumnItems(),
        									aVisibleTableItems = oP13nColumnsPanel._getVisibleTableItems(),
        									oMarkedTableItem = oP13nColumnsPanel._getMarkedTableItem(),
        									iMarkedTableItemIndex = aVisibleTableItems.indexOf(oMarkedTableItem),
        									oMarkedTargetColumn = aColumnItem[iMarkedTableItemIndex].targetColumn,
        									oTableItemTo = aVisibleTableItems[iMarkedTableItemIndex - 1],
        									iTableItemToIndex = aVisibleTableItems.indexOf(oTableItemTo),
        									bExistMultiLabels = aColumnItem[iTableItemToIndex].existMultiLabels;
        								
        								if(bExistMultiLabels) {
        									var aTargetColumnItem = [], iIndexTo;
        									
        									aColumnItem.reduce(function(aTargetColumnItem, oColumnItem) {
        										var iIndex = oColumnItem.index;
        										if(iIndex < iMarkedTableItemIndex) {
        											aTargetColumnItem.push(oColumnItem);
        										}
        										return aTargetColumnItem;
        									}, aTargetColumnItem);
        									aTargetColumnItem.reverse().some(function(oColumnItem) {
        										var iIndex = oColumnItem.index,
        											bIsColumnMovableTo = this._isColumnMovableTo(oMarkedTargetColumn, iIndex);
        										
        										if(bIsColumnMovableTo) {
        											iIndexTo = iIndex;
        											return true;
        										}
        									}.bind(this));
        									
        									if(typeof iIndexTo === "number") {
        										oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, aVisibleTableItems[iIndexTo]);
        									}
        									
//        									aTargetColumnItem.reverse().some(function(oTargetColumnItem, iIndex) {
//        										var oTargetColumn = oTargetColumnItem.targetColumn,
//        											iTargetColumnIndex = oTargetColumnItem.index,
//    												bIsColumnMovableTo = sap.ui.table.TableColumnUtils.isColumnMovableTo(oTargetColumn, iTargetColumnIndex);
//    										
//        										iTableItemToIndex = iTargetColumnIndex;
//        										
//        										if(!bIsColumnMovableTo && iIndex < (aTargetColumnItem.length-1)) {
//        											var oPrevTargetColumn = aTargetColumnItem[iIndex+1].targetColumn,
//        												bIsPrevColumnMovableTo = TableColumnUtils.isColumnMovableTo(oPrevTargetColumn, iTargetColumnIndex-1);
//        											
//        											if(bIsPrevColumnMovableTo) {
//        												return true;
//        											}
//        										} else {
//        											return bIsColumnMovableTo;
//        										}
//        										console.log("bIsColumnMovableTo", bIsColumnMovableTo);
//        									});
//        									
//        									oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, aVisibleTableItems[iTableItemToIndex]);
        								} else {
        									oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, oTableItemTo);
        								}
        							}.bind(this));
        						} else if(sIconURI === "sap-icon://slim-arrow-down") {
        							oContent.mEventRegistry.press = null;
        							oContent.attachPress(function(oEvent) {
        								var aColumnItem = fnGetColumnItems(),
    										aVisibleTableItems = oP13nColumnsPanel._getVisibleTableItems(),
    										oMarkedTableItem = oP13nColumnsPanel._getMarkedTableItem(),
    										iMarkedTableItemIndex = aVisibleTableItems.indexOf(oMarkedTableItem),
    										oMarkedTargetColumn = aColumnItem[iMarkedTableItemIndex].targetColumn,
        									oTableItemTo = aVisibleTableItems[iMarkedTableItemIndex + 1],
        									iTableItemToIndex = aVisibleTableItems.indexOf(oTableItemTo),
        									bExistMultiLabels = aColumnItem[iTableItemToIndex].existMultiLabels;
        									
        								if(bExistMultiLabels) {
        									var aTargetColumnItem = [], iIndexTo;
        									
        									aColumnItem.reduce(function(aTargetColumnItem, oColumnItem) {
        										var iIndex = oColumnItem.index;
        										if(iIndex > iMarkedTableItemIndex) {
        											aTargetColumnItem.push(oColumnItem);
        										}
        										return aTargetColumnItem;
        									}, aTargetColumnItem);
        									aTargetColumnItem.some(function(oColumnItem) {
        										var iIndex = oColumnItem.index,
        											bIsColumnMovableTo = this._isColumnMovableTo(oMarkedTargetColumn, iIndex);
        										
        										if(bIsColumnMovableTo) {
        											iIndexTo = iIndex;
        											return true;
        										}
        									}.bind(this));
        									
        									if(typeof iIndexTo === "number") {
        										oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, aVisibleTableItems[iIndexTo]);
        									}
        									
//        									aColumnItem.reduce(function(aTargetColumnItem, oColumnItem) {
//        										var iIndex = oColumnItem.index;
//        										if(iIndex > iMarkedTableItemIndex) {
//        											aTargetColumnItem.push(oColumnItem);
//        										}
//        										return aTargetColumnItem;
//        									}, aTargetColumnItem);
//        									aTargetColumnItem.some(function(oTargetColumnItem, iIndex) {
//        										var oTargetColumn = oTargetColumnItem.targetColumn,
//        											iTargetColumnIndex = oTargetColumnItem.index,
//        											bIsColumnMovableTo = TableColumnUtils.isColumnMovableTo(oTargetColumn, iTargetColumnIndex);
//        										
//        										iTableItemToIndex = iTargetColumnIndex;
//        										
//        										if(!bIsColumnMovableTo && iIndex < (aTargetColumnItem.length-1)) {
//        											var oNextTargetColumn = aTargetColumnItem[iIndex+1].targetColumn,
//        												bIsNextColumnMovableTo = TableColumnUtils.isColumnMovableTo(oNextTargetColumn, iTargetColumnIndex+1);
//        											
//        											if(bIsNextColumnMovableTo) {
//        												return true;
//        											}
//        										} else {
//        											return bIsColumnMovableTo;
//        										}
//        										console.log("bIsColumnMovableTo", bIsColumnMovableTo);
//        									});
//        									
//        									oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, aVisibleTableItems[iTableItemToIndex]);
        								} else {
        									oP13nColumnsPanel._moveMarkedTableItem(oMarkedTableItem, oTableItemTo);
        								}
        							}.bind(this));
        						}
        					} 
        				}.bind(this));
        			}
        		}.bind(this));
        	}
        },
        
        /**
         * 테이블 초기 설정
         */
        _setTableSettings: function() {
        	var oTable = this._oTable,
        		oToolbar = oTable.getToolbar();
        	
        	// 툴바 설정
        	if(oToolbar) {
        		var aContent = oToolbar.getContent();
        		if(aContent.length > 0) {
        			var bExistToolbarspacer = false, bExistPersoButton = false;
        			aContent.forEach(function(oContent) {
        				if(oContent instanceof sap.m.ToolbarSpacer) {
        					bExistToolbarspacer = true;
        				}
        				if(oContent instanceof sap.m.Button && oContent.getIcon().indexOf("action-settings") > -1) {
        					bExistPersoButton = true;
        				}
        			});
        			if(!bExistToolbarspacer) {
        				oToolbar.addContent(new sap.m.ToolbarSpacer());
        			}
        			if(!bExistPersoButton) {
        				oToolbar.addContent(new sap.m.Button({
        					icon: "sap-icon://action-settings",
        					press: function() {
        						this._oDialog.open();
        					}.bind(this)
        				}));
        			}
        		} else {
        			oToolbar.addContent(new sap.m.ToolbarSpacer());
        			oToolbar.addContent(new sap.m.Button({
    					icon: "sap-icon://action-settings",
    					press: function() {
    						this._oDialog.open();
    					}.bind(this)
    				}));
        		}
        	} else {
        		oTable.setToolbar(new sap.m.OverflowToolbar({
        			content: [
        				new sap.m.ToolbarSpacer(),
        				new sap.m.Button({
        					icon: "sap-icon://action-settings",
        					press: function() {
        						this._oDialog.open();
        					}.bind(this)
        				})
        			]
        		}));
        	}
        	
        	//컬럼이동은 사용자 설정에서 하기때문에 퍼포먼스를 위해 테이블 자체는 막음.(드래그앤드랍)
        	oTable.attachColumnMove(function(oEvent) {
        		oEvent.preventDefault();
        	}.bind(this));
        },
        
        /**
         * 테이블 개인화 정보를 저장한다.
         */
        _doSavePersoData: function(oPersoData) {
        	// 임시로 로컬 스토리지 저장 - 차후 RFC 저장로직으로 변경
        	sap.ui.require(["sap/ui/util/Storage"], function(oStorage) {
        		var oLocalStorage = new oStorage(oStorage.Type.local);
        		oLocalStorage.put(this._oTable.getId(), JSON.stringify(oPersoData));
        		this._getSavePersoData();
        	}.bind(this));
        },
        
        /**
         * 저장된 테이블 개인화 정보를 불러온다.
         */
        _getSavePersoData: function(fnCallBack) {
        	// 임시로 로컬 스토리지 사용 - 차후 RFC 호출로직으로 변경
        	sap.ui.require(["sap/ui/util/Storage"], function(oStorage) {
        		var oLocalStorage = new oStorage(oStorage.Type.local),
        			sPersoData = oLocalStorage.get(this._oTable.getId());
        		
        		if(sPersoData) {
        			try {
        				this._oSavePersoData = JSON.parse(sPersoData);
        			} catch(e) {
        				this._oSavePersoData = null;
        				console.error(e);
        			}
        		} else {
        			this._oSavePersoData = null;
        		}
        		
        		if(fnCallBack && typeof fnCallBack === "function") {
        			fnCallBack.call(this);
        		}
        	}.bind(this));
        },
        
        /**
         * 
         */
        _isColumnMovableTo: function(oColumn, iNewIndex) {
			var oTable = this._oTable;

			if(!oTable || iNewIndex === undefined || !TableColumnUtils.isColumnMovable(oColumn)) {
				// Column is not movable at all
				return false;
			}

			if(iNewIndex < oTable.getComputedFixedColumnCount() || iNewIndex < oTable._iFirstReorderableIndex) {
				// No movement of fixed columns or e.g. the first column in the TreeTable
				return false;
			}

			var iCurrentIndex = oTable.indexOfColumn(oColumn),
				aColumns = oTable.getColumns();

			if(iNewIndex > iCurrentIndex) { // Column moved to higher index
				// The column to be moved will appear after this column.
				var oBeforeColumn = aColumns[iNewIndex >= aColumns.length ? aColumns.length - 1 : iNewIndex];
				var oTargetBoundaries = TableColumnUtils.getColumnBoundaries(oTable, oBeforeColumn.getId());
				if(TableColumnUtils.hasHeaderSpan(oBeforeColumn) || oTargetBoundaries.endIndex > iNewIndex) {
					return false;
				}
			} else {
				var oAfterColumn = aColumns[iNewIndex]; // The column to be moved will appear before this column.
				if(TableColumnUtils.getParentSpannedColumns(oTable, oAfterColumn.getId()).length != 0) {
					// If column which is currently at the desired target position is spanned by previous columns
					// also the column to reorder would be spanned after the move.
					return false;
				}
			}

			return true;
		},
        
        /**
         * 사용자 액션에 의해서 설정정보가 변경되었는지 여부를 체크한다.
         */
        _isChangedItems: function() {
        	var bEqual = true;
        	// 데이터 일치 여부 체크 함수정의
        	var fnIsEqual = function(aCurrentData, aSaveData, sCompareItemKey) {
        		if(aCurrentData.length !== aSaveData.length) {
        			return false;
        		}
        		var fnSort = function(a, b) {
        			if(a.columnKey < b.columnKey) {
        				return -1;
        			} else if(a.columnKey > b.columnKey) {
        				return 1;
        			} else {
        				return 0;
        			}
        		};
        		aCurrentData.sort(fnSort);
        		aSaveData.sort(fnSort);
        		var aItemsNotEqual = aCurrentData.filter(function(oCurrentData, iIndex) {
        			var bNotEqual = false,
        				aCurrentDataKeys = Object.keys(oCurrentData);
        			aCurrentDataKeys.some(function(sKey) {
        				if(sCompareItemKey === "aColumnItem") {
        					if(oCurrentData.visible !== aSaveData[iIndex].visible || oCurrentData.index !== aSaveData[iIndex].index) {
        						bNotEqual = true;
        						return true;
        					}
        				} else {
        					if(oCurrentData[sKey] !== aSaveData[iIndex][sKey]) {
            					bNotEqual = true;
            					return true;
            				}
        				}
        			});
        			return bNotEqual;
        		});
        		return (aItemsNotEqual.length === 0);
        	};
        	
        	var oLayoutModel = this._oDialog.getModel("layoutModel"),
        		oCopyPersoData = $.extend(true, {}, this._oDialog.getModel("persoModel").getProperty("/")),
        		oCopySavePersoData = $.extend(true, {}, this._oSavePersoData),
        		aPersoDataKeys;
        	
        	delete oCopyPersoData.aItem;
        	delete oCopySavePersoData.aItem;
        	
        	aPersoDataKeys = Object.keys(oCopyPersoData);
        	aPersoDataKeys.some(function(sKey) {
        		bEqual = fnIsEqual(oCopyPersoData[sKey], oCopySavePersoData[sKey], sKey);
        		if(!bEqual) {
        			return true;
        		}
        	}.bind(this));
        	
        	if(bEqual) {
        		oLayoutModel.setProperty("/bResetEnabled", false);
        	} else {
        		oLayoutModel.setProperty("/bResetEnabled", true);
        	}
        },
        
        /**
         * 그룹설정을 해제한다.
         */
        _clearGrouping: function() {
        	var oTable = this._oTable,
        		oBinding = oTable.getBinding("rows"),
            	oBindingInfo = oTable.getBindingInfo("rows"),
            	oGroupColumn = sap.ui.getCore().byId(oTable.getGroupBy()); 
        
	        if(oGroupColumn) {
	            oGroupColumn.setGrouped(false);
	        }
	        if(oBinding && oBinding._modified) {
	            TableGrouping.clearMode(oTable);
	            oTable.bindRows(oBindingInfo);
	        }
        },
        
        _checkGroupItem: function() {
        	var oLayoutModel = this._oDialog.getModel("layoutModel"),
	    		oLayoutData = oLayoutModel.getProperty("/"),
	    		oSavePersoData = this._oSavePersoData;
    	
	    	if(oSavePersoData.aGroupItem.length > 0) {
	    		oLayoutData.sort.bEnabled = false;
	            oLayoutData.filter.bEnabled = false;
	    	} else {
	    		oLayoutData.sort.bEnabled = true;
	            oLayoutData.filter.bEnabled = true;
	    	}
	    	
	    	oLayoutModel.refresh(false);
        },
        
        _getTemplateBindingInfo: function(oColumn, oItem) {
        	var oTemplate = oColumn.getTemplate(),
        		sBindKey = "", sValueType = "", oBindingInfo;
        	
        	if(oTemplate instanceof sap.m.Text || oTemplate instanceof sap.m.Link || oTemplate instanceof sap.m.Label) {
        		sBindKey = oTemplate.getBindingPath("text");
        		oBindingInfo = oTemplate.getBindingInfo("text");
        		if(oBindingInfo && oBindingInfo.type) {
        			switch(oBindingInfo.type.getName()) {
        			case "Currency": 
        			case "Integer":
        			case "Float":
        				sValueType = "int";
        				break;
        			default:
        				sValueType = "string";
        				break;
        			}
        		} else {
        			sValueType = "string";
        		}
        	} else if(oTemplate instanceof sap.m.Select || oTemplate instanceof sap.m.ComboBox) {
        		sBindKey = oTemplate.getBindingPath("selectedKey");
        		sValueType = "string";
        	} else if(oTemplate instanceof sap.m.Input) {
        		sBindKey = oTemplate.getBindingPath("value");
        		sValueType = "string";
        	} else if(oTemplate instanceof sap.m.CheckBox || oTemplate instanceof sap.m.RadioButton) {
        		sBindKey = oTemplate.getBindingPath("selected");
        		sValueType = "boolean";
        	} else if(oTemplate instanceof sap.m.RadioButtonGroup) {
        		sBindKey = oTemplate.getBindingPath("selectedIndex");
        		sValueType = "int";
        	} else if(oTemplate instanceof sap.m.ObjectNumber) {
        		sBindKey = oTemplate.getBindingPath("number");
        		sValueType = "int";
        	} else {
        		sBindKey = "";
        		sValueType = "";
        	}

        	oItem["columnKey"] = sBindKey;
        	oItem["type"] = sValueType;
        },
        
        /**
         * 테이블 개인화 다이어로그 호출 후 view단에 반환
         */
        load: function(oController, oTable) {
        	var oDeferred = $.Deferred();
        	
        	Fragment.load({
				name: "SCMTMS_GEOMAP.fragment.PersonalizationDialog",
				controller: oController
			}).then(function(oDialog) {
				oController.onInit(oDialog, oTable);
				oDeferred.resolve(oDialog);
			});
        	
        	return oDeferred.promise();
        }
    });
});

<core:FragmentDefinition
	xmlns="sap.m"
	xmlns:core="sap.ui.core"
	xmlns:l="sap.ui.layout">
	<P13nDialog
		showReset="true"
		showResetEnabled="{layoutModel>/bResetEnabled}"
		ok="onOK"
		cancel="onCancel"
		reset="onCancel"
		beforeOpen="onBeforeOpen">
        <panels>
            <P13nColumnsPanel
            	visible="{layoutModel>/columns/visible}"
            	items="{persoModel>/aItem}"
            	columnsItems="{persoModel>/aColumnItem}"
            	changeColumnsItems="onChangeColumnsItems">
                <items>
                    <P13nItem columnKey="{persoModel>columnKey}" text="{persoModel>text}" />
                </items>
                <columnsItems>
                    <P13nColumnsItem
                        columnKey="{persoModel>columnKey}"
                        index="{persoModel>index}"
                        width="{persoModel>width}"
                        visible="{persoModel>visible}">
                   <!--      <customData>
                        	<core:customData key="columnId" value="{persoModel>columnId}" />
                        	<core:customData key="columnName" value="{persoModel>columnName}" />
                        	<core:customData key="columnHAlign" value="{persoModel>hAlign}" />
                        	<core:customData key="existMultiLabels" value="{persoModel>existMultiLabels}" />
                        </customData> -->
                    </P13nColumnsItem>
                </columnsItems>
            </P13nColumnsPanel>
            <P13nSortPanel
            	visible="{layoutModel>/sort/visible}"
                items="{persoModel>/aItem}"
                sortItems="{persoModel>/aSortItem}"
                addSortItem="onChangeSortItem"
                updateSortItem="onChangeSortItem"
                removeSortItem="onChangeSortItem">
                <items>
                    <P13nItem columnKey="{persoModel>columnKey}" text="{persoModel>text}" />
                </items>
                <sortItems>
                    <P13nSortItem columnKey="{persoModel>columnKey}" operation="{persoModel>operation}" />
                </sortItems>
            </P13nSortPanel>
            <P13nFilterPanel
            	visible="{layoutModel>/filter/visible}"
            	items="{persoModel>/aItem}"
            	filterItems="{persoModel>/aFilterItem}"
            	filterItemChanged="onChangeFilterItem">
            	<!--addFilterItem="onChangeFilterItem"
            	updateFilterItem="onChangeFilterItem"
            	removeFilterItem="onChangeFilterItem"-->
            	<items>
                    <P13nItem columnKey="{persoModel>columnKey}" text="{persoModel>text}" type="{persoModel>type}" />
                </items>
                <filterItems>
                	<P13nFilterItem 
                		columnKey="{persoModel>columnKey}"
                		exclude="{persoModel>exclude}"
                		operation="{persoModel>operation}"
                		value1="{persoModel>value1}"
                		value2="{persoModel>value2}" />
                </filterItems>
            </P13nFilterPanel>
            <P13nGroupPanel
            	visible="{layoutModel>/group/visible}"
                maxGroups="1"
                items="{persoModel>/aItem}"
                groupItems="{persoModel>/aGroupItem}"
                addGroupItem="onChangeGroupItem"
                updateGroupItem="onChangeGroupItem"
                removeGroupItem="onChangeGroupItem">
                <items>
                    <P13nItem columnKey="{persoModel>columnKey}" text="{persoModel>text}" />
                </items>
                <groupItems>
                    <P13nGroupItem 
                        columnKey="{persoModel>columnKey}"
                        operation="{persoModel>operation}"
                        showIfGrouped="{persoModel>showIfGrouped}" />
                </groupItems>
            </P13nGroupPanel>
        </panels>
    </P13nDialog>
</core:FragmentDefinition>
