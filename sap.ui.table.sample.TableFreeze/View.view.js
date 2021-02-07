sap.ui.jsview("sap.ui.table.sample.TableFreeze.View", {
	oTable: undefined,

	/** Specifies the Controller belonging to this View. 
	 * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	 * @memberOf controller.Main
	 */
	getControllerName: function() {
		return "sap.ui.table.sample.TableFreeze.Controller";
	},

	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	 * Since the Controller is given to this method, its event handlers can be attached right away.
	 * @memberOf controller.Main
	 */
	createContent: function(oController) {
		var oPage = new sap.m.Page({
			title: "{i18n>title}",
			content: [ this.createTable(oController) ]
		});

		var app = new sap.m.App("myApp", {
			initialPage: oPage
		});
		app.addPage(oPage);
		return app;
	},
	
	createTable: function(oController) {
		var oTable = MF.uitable({
			visibleRowCount: 10,
			fixedColumnCount: 3,
			enableGrouping: true,
			selectionMode: 'MultiToggle',
			useExportExcel: true,
			exportExcelText: '엑셀 다운로드',
			usePersoController: true,
			persoData: JSON.parse(localStorage.getItem('dhku')),
			savePersoData: function(oEvent) {
				localStorage.setItem('dhku', JSON.stringify(oEvent.getParameter('persoData')));
			},
			columns: [
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Ship Country' }),
					template: new sap.m.Text({ text: '{ShipCountry}' }),
					sortProperty: 'ShipCountry',
					filterProperty: 'ShipCountry',
					width: '120px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Customer Name' }),
					template: new sap.m.Text({ text: '{ContactName}' }),
					sortProperty: 'ContactName',
					filterProperty: 'ContactName',
					width: '180px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Order ID' }),
					template: new sap.m.Text({ text: '{OrderID}' }),
					sortProperty: 'OrderID',
					filterProperty: 'OrderID',
					width: '100px',
					hAlign: 'Center'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Order Date' }),
					template: new sap.m.Text({ text: '{OrderDate}' }),
					sortProperty: 'OrderDate',
					filterProperty: 'OrderDate',
					width: '130px',
					hAlign: 'Center'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Required Date' }),
					template: new sap.m.Text({ text: '{RequiredDate}' }),
					sortProperty: 'OrderDate',
					filterProperty: 'OrderDate',
					width: '130px',
					hAlign: 'Center'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipped Date' }),
					template: new sap.m.Text({ text: '{ShippedDate}' }),
					sortProperty: 'ShippedDate',
					filterProperty: 'ShippedDate',
					width: '130px',
					hAlign: 'Center'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping Via' }),
					template: new sap.m.Text({ text: '{ShipVia}' }),
					sortProperty: 'ShipVia',
					filterProperty: 'ShipVia',
					width: '150px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Freight' }),
					template: new sap.m.Text({ 
						text: {
							path: 'Freight',
							type: 'sap.ui.model.type.Integer' 
						}
					}),
					sortProperty: 'Freight',
					filterProperty: 'Freight',
					width: '80px',
					hAlign: 'Right'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping Name' }),
					template: new sap.m.Text({ text: '{ShipName}', maxLines: 1, tooltip: '{ShipName}' }),
					sortProperty: 'ShipName',
					filterProperty: 'ShipName',
					width: '250px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping Address' }),
					template: new sap.m.Text({ text: '{ShipAddress}', maxLines: 1, tooltip: '{ShipAddress}' }),
					sortProperty: 'ShipAddress',
					filterProperty: 'ShipAddress',
					width: '300px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping City' }),
					template: new sap.m.Text({ text: '{ShipCity}' }),
					sortProperty: 'ShipCity',
					filterProperty: 'ShipCity',
					width: '150px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping Region' }),
					template: new sap.m.Text({ text: '{ShipRegion}' }),
					sortProperty: 'ShipRegion',
					filterProperty: 'ShipRegion',
					width: '150px'
				}),
				new sap.ui.table.Column({
					label: new sap.m.Label({ text: 'Shipping Postal Code' }),
					template: new sap.m.Text({ text: '{ShipPostalCode}' }),
					sortProperty: 'ShipPostalCode',
					filterProperty: 'ShipPostalCode',
					width: '160px'
				})
			],
			rows: '{/data}'
        });
		return oTable;
	}
});