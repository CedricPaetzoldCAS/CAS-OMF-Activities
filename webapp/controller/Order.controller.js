
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {sap/ui/model/json/JSONModel} JSONModel
     */
    function (BaseController, JSONModel, Fragment) {
        "use strict";
        return BaseController.extend("de.cas.omfactivities.controller.Order", {

            onInit: function () {
                let oViewModel = new JSONModel({
                    orderId: "",
                    Items: {},
                });
                this.getView()
                    .setModel(oViewModel, "orderView");
            },

            onSubmitOrderId: async function (oEvent) {

                const oRequestModel = this.getView().getModel("requestModel");
                const oViewModel = this.getView().getModel("orderView");
                const sOrderId = oViewModel.getProperty("/orderId");
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const sAppModulePath = this.getAppModulePath();

                try {
                    await oRequestModel.loadData(sAppModulePath + `/api/v2/orders`, { displayId: sOrderId });
                    const oOrder = oRequestModel.getData()[0];
                    oViewModel.setProperty("/Order", oOrder);

                    let createdTime = oOrder.metadata.createdAt;
                    let cnewDate = createdTime.slice(0, 10);
                    let cnewTime = createdTime.slice(12, 19);
                    let newcreatedTime = " " + cnewDate + " " + cnewTime;
                    oViewModel.setProperty("/Order/metadata/createdAt", newcreatedTime);

                    const sItemURL = sAppModulePath + "/api/v2/orders/" + oOrder.id + "/items";
                    await oRequestModel.loadData(sItemURL);
                    const oItems = oRequestModel.getData();
                    oViewModel.setProperty("/Items", oItems);

                    const sActivitiesURL = sAppModulePath + "/api/v1/orderActivities?orderId=" + oOrder.id;
                    await oRequestModel.loadData(sActivitiesURL);
                    const oActivities = oRequestModel.getData();
                    oViewModel.setProperty("/Activities", oActivities);
                    console.log(oActivities);

                    oItems.forEach(function (item) {
                        item.activities = [];
                        item.fulfillment.return = 0;

                        //checks how many are cancelled
                        if (item.fulfillment.cancellation.canceled == true) {
                            item.fulfillment.cancellation.nr = item.quantity.value;
                        } else {
                            item.fulfillment.cancellation.nr = 0;
                        }

                        //gets activities
                        oActivities.forEach(function (activity) {

                            activity.items.forEach(function (actitem) {

                                if (actitem.id == item.id) {
                                    const oActivity = {
                                        activity: "",
                                        date: ""
                                    };

                                    if (activity.type == "SAP_ORDERCREATED") {
                                        oActivity.activity = oResourceBundle.getText("activities.orderCreated");
                                        oActivity.icon = "sap-icon://add-product";
                                    } else if (activity.type == "SAP_FULFILLMENTREQUESTCREATED") {
                                        oActivity.activity = oResourceBundle.getText("activities.fulfillmentrequestCreated");
                                        oActivity.Icon = "sap-icon://add-activity-2";
                                    } else if (activity.type == "SAP_DELIVERED") {
                                        oActivity.activity = oResourceBundle.getText("activities.delivered");
                                        oActivity.icon = "sap-icon://shipping-status";
                                    } else if (activity.type == "SAP_ITEMFULLYDELIVERED") {
                                        oActivity.activity = oResourceBundle.getText("activities.itemFullyDelivered");
                                        oActivity.icon = "sap-icon://accept";
                                    } else if (activity.type == "SAP_ITEMCHANGED_DURING_PROCESSING") {
                                        oActivity.activity = oResourceBundle.getText("activities.itemChangedDuringProcessing");
                                        oActivity.icon = "sap-icon://edit";
                                    } else if (activity.type == "SAP_ITEMCANCELED_DURING_PROCESSING") {
                                        oActivity.activity = oResourceBundle.getText("activities.itemCanceledDuringProcessing");
                                        oActivity.icon = "sap-icon://decline";
                                    } else if (activity.type == "RETURN") {
                                        oActivity.activity = oResourceBundle.getText("activities.return");
                                        oActivity.icon = "sap-icon://redo";
                                        item.fulfillment.return++;
                                    };

                                    let dateTime = activity.occurredAt;

                                    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
                                    const dateMatch = dateTime.match(dateRegex);

                                    if (dateMatch) {
                                        let year = dateMatch[1];
                                        let month = dateMatch[2];
                                        let day = dateMatch[3];

                                        const timeRegex = /T(\d{2}:\d{2}:\d{2})/;
                                        const timeMatch = dateTime.match(timeRegex);

                                        if (timeMatch) {
                                            let newTime = timeMatch[1];
                                            let newDateTime = day + "." + month + "." + year + " " + newTime;
                                            oActivity.date = newDateTime;
                                            item.activities.push(oActivity);
                                        } else {
                                            console.log("i18n>activities.timeError");
                                        }
                                    } else {
                                        console.log("i18n>activities.dateError");
                                    }

                                };
                            });
                        });
                    });
                    console.log(oItems);
                    //console.log(oViewModel);
                    oViewModel.refresh();

                }
                catch (oError) {
                    console.log(oError);
                }
            },

            handlePopoverPress: async function (oEvent) {
                var oButton = oEvent.getSource();
                var oView = this.getView();
                const oViewModel = this.getView().getModel("orderView");
                const oItems = oViewModel.getProperty("/Items");

                // creates popover
                if (!this._oPopover) {
                    this._oPopover = await Fragment.load({
                        id: oView.getId(),
                        name: "de.cas.omfactivities.view.fragments.Popover",
                        controller: this
                    });
                    oView.addDependent(this._oPopover);
                }   //opens Popover
                this._oPopover.openBy(oButton);

                let buttonId = oButton.getBindingContext("orderView").getPath()
                let patternForId = /[0-9]/g;
                let shortButtonId = buttonId.match(patternForId);
                shortButtonId = ++shortButtonId;

                let buttonActivities = oItems.find(item => item.lineNumber == shortButtonId);
                oViewModel.setProperty("/ButtonActivities", buttonActivities);

            },

            //closes the popover 
            onPressClosePopover: function (oEvent) {
                this._oPopover.close();
            }


            

        });

    });
