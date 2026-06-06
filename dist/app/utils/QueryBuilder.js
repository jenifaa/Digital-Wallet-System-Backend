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
exports.QueryBuilder = void 0;
const global_constant_1 = require("../global.constant");
class QueryBuilder {
    constructor(modelQuery, query) {
        this.filterQuery = {};
        this.modelQuery = modelQuery;
        this.query = query;
    }
    filter() {
        const filter = Object.assign({}, this.query);
        for (const field of global_constant_1.excludeField) {
            delete filter[field];
        }
        this.filterQuery = filter;
        this.modelQuery = this.modelQuery.find(filter);
        return this;
    }
    search(searchableField) {
        const searchTerm = this.query.searchTerm || "";
        if (!searchTerm) {
            return this;
        }
        const searchQuery = {
            $or: searchableField.map((field) => ({
                [field]: { $regex: searchTerm, $options: "i" },
            })),
        };
        this.modelQuery = this.modelQuery.find(searchQuery);
        return this;
    }
    dateRange(field = "createdAt") {
        const { startDate, endDate } = this.query;
        if (!startDate && !endDate) {
            return this;
        }
        const range = {};
        if (startDate) {
            range.$gte = new Date(startDate);
        }
        if (endDate) {
            range.$lte = new Date(endDate);
        }
        this.modelQuery = this.modelQuery.find({ [field]: range });
        return this;
    }
    amountRange(field = "amount") {
        const { minAmount, maxAmount } = this.query;
        if (!minAmount && !maxAmount) {
            return this;
        }
        const range = {};
        if (minAmount) {
            range.$gte = Number(minAmount);
        }
        if (maxAmount) {
            range.$lte = Number(maxAmount);
        }
        this.modelQuery = this.modelQuery.find({ [field]: range });
        return this;
    }
    sort() {
        const sort = this.query.sort || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    fields() {
        var _a;
        const fields = ((_a = this.query.fields) === null || _a === void 0 ? void 0 : _a.split(",").join(" ")) || "";
        if (fields) {
            this.modelQuery = this.modelQuery.select(fields);
        }
        return this;
    }
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    build() {
        return this.modelQuery;
    }
    getMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            const baseFilter = Object.assign({}, this.filterQuery);
            if (this.query.searchTerm) {
                // meta count should reflect search; rebuild search filter for count
                // For simplicity, count on current filtered query without pagination
            }
            const totalDocuments = yield this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
            const page = Number(this.query.page) || 1;
            const limit = Number(this.query.limit) || 10;
            const totalPage = Math.ceil(totalDocuments / limit) || 1;
            return {
                page,
                limit,
                total: totalDocuments,
                totalPage,
            };
        });
    }
}
exports.QueryBuilder = QueryBuilder;
