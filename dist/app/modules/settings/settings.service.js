"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const settings_interface_1 = require("./settings.interface");
const settings_model_1 = require("./settings.model");
let cachedSettings = null;
const getSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    if (cachedSettings) {
        return cachedSettings;
    }
    let settings = yield settings_model_1.SystemSettings.findOne();
    if (!settings) {
        settings = yield settings_model_1.SystemSettings.create(settings_interface_1.DEFAULT_SETTINGS);
    }
    cachedSettings = settings.toObject();
    return cachedSettings;
});
const updateSettings = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield settings_model_1.SystemSettings.findOne();
    if (!settings) {
        settings = yield settings_model_1.SystemSettings.create(Object.assign(Object.assign(Object.assign({}, settings_interface_1.DEFAULT_SETTINGS), payload), { updatedBy: adminId }));
    }
    else {
        Object.assign(settings, payload, { updatedBy: adminId });
        yield settings.save();
    }
    cachedSettings = settings.toObject();
    return cachedSettings;
});
const invalidateCache = () => {
    cachedSettings = null;
};
exports.SettingsService = {
    getSettings,
    updateSettings,
    invalidateCache,
};
