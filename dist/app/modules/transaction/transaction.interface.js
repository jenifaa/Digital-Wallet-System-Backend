"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_COMMISSION_PERCENT = exports.TransactionEntry = exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["ADD"] = "ADD";
    TransactionType["WITHDRAW"] = "WITHDRAW";
    TransactionType["SEND"] = "SEND";
    TransactionType["CASH_IN"] = "CASH_IN";
    TransactionType["CASH_OUT"] = "CASH_OUT";
    TransactionType["PAYMENT"] = "PAYMENT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["SUCCESS"] = "SUCCESS";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["REVERSED"] = "REVERSED";
    TransactionStatus["PAID"] = "PAID";
    TransactionStatus["UNPAID"] = "UNPAID";
    TransactionStatus["REFUNDED"] = "REFUNDED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TransactionEntry;
(function (TransactionEntry) {
    TransactionEntry["DEBIT"] = "DEBIT";
    TransactionEntry["CREDIT"] = "CREDIT";
})(TransactionEntry || (exports.TransactionEntry = TransactionEntry = {}));
exports.AGENT_COMMISSION_PERCENT = 2;
