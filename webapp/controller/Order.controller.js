sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {sap/ui/model/json/JSONModel} JSONModel
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("de.cas.omfactivities.controller.Order", {
            onInit: function () {
                const oViewModel = new JSONModel({
                    orderId: "42",
                });
                this.getView().setModel(oViewModel, "orderView");

            },

            onSubmitOrderId: async function (oEvent) {

                const oRequestModel = this.getView().getModel("requestModel");
                const oViewModel = this.getView().getModel("orderView");
                const sOrderId = oViewModel.getProperty("/orderId");
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

                try {
                    await oRequestModel.loadData(`/api/v2/orders`, { displayId: sOrderId });
                    const oOrder = oRequestModel.getData()[0];
                    oViewModel.setProperty("/Order", oOrder);
                    console.log(oOrder);

                    let createdTime = oOrder.metadata.createdAt;
                    let cnewDate = createdTime.slice(0, 10);
                    let cnewTime = createdTime.slice(12, 19);
                    let newcreatedTime = " " + cnewDate + " " + cnewTime;
                    oViewModel.setProperty("/Order/metadata/createdAt", newcreatedTime);

                    const sItemURL = "/api/v2/orders/" + oOrder.id + "/items";
                    await oRequestModel.loadData(sItemURL);
                    const oItems = oRequestModel.getData();
                    oViewModel.setProperty("/Items", oItems);
                    console.log(oItems);

                    const sActivitiesURL = "/api/v1/orderActivities?orderId=" + oOrder.id;
                    await oRequestModel.loadData(sActivitiesURL);
                    const oActivities = oRequestModel.getData();
                    oViewModel.setProperty("/Activities", oActivities);
                    console.log(oActivities);

                    oItems.forEach(function (item) {
                        item.activities = [];
                        item.fulfillment.return = 0;

                        if (item.fulfillment.cancellation.canceled == true) {
                            item.fulfillment.cancellation.nr = item.quantity.value;
                        } else {
                            item.fulfillment.cancellation.nr = 0;
                        }

                        oActivities.forEach(function (activity) {

                            activity.items.forEach(function (actitem) {

                                if (actitem.id == item.id) {

                                    if (activity.type == "SAP_ORDERCREATED") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.orderCreated"));
                                    } else if (activity.type == "SAP_FULFILLMENTREQUESTCREATED") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.fulfillmentrequestCreated"));
                                    } else if (activity.type == "SAP_DELIVERED") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.delivered"));
                                    } else if (activity.type == "SAP_ITEMFULLYDELIVERED") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.itemFullyDelivered"));
                                    } else if (activity.type == "SAP_ITEMCHANGED_DURING_PROCESSING") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.itemChangedDuringProcessing"));
                                    } else if (activity.type == "SAP_ITEMCANCELED_DURING_PROCESSING") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.itemCanceledDuringProcessing"));
                                    } else if (activity.type == "RETURN") {
                                        item.activities.push(" " + oResourceBundle.getText("activities.return"));
                                        item.fulfillment.return++;
                                    };

                                    let dateTime = activity.occurredAt;
                                    let newDate = dateTime.slice(0, 10);
                                    let newTime = dateTime.slice(12, 19);
                                    let newDateTime = " " + newDate + " " + newTime + " \n";
                                    item.activities.push(newDateTime);

                                };
                            });
                        });
                    });
                    console.log(oItems);
                    console.log(oViewModel);
                    oViewModel.refresh();
                }
                catch (oError) {
                    console.log(oError);
                }
            }
        });
    });
