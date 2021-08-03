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
