sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    'use strict';
    return Controller.extend("cas.opf.priceSimulationOverview.controller.BaseController", {
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },
        getModel: function (sName) {
            return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
        },
        getAppModulePath: function () {
            const sAppId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const sAppPath = sAppId.replaceAll(".", "/");
            const sAppModulePath = jQuery.sap.getModulePath(sAppPath);
            return sAppModulePath;
        }
    });
});