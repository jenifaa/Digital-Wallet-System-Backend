
/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Query } from "mongoose";
import { excludeField } from "../global.constant";


export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;
  private filterQuery: Record<string, unknown> = {};

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };
    for (const field of excludeField) {
      delete filter[field];
    }
    this.filterQuery = filter;
    this.modelQuery = this.modelQuery.find(filter);
    return this;
  }

  search(searchableField: string[]): this {
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

  dateRange(field = "createdAt"): this {
    const { startDate, endDate } = this.query;
    if (!startDate && !endDate) {
      return this;
    }

    const range: Record<string, Date> = {};
    if (startDate) {
      range.$gte = new Date(startDate);
    }
    if (endDate) {
      range.$lte = new Date(endDate);
    }

    this.modelQuery = this.modelQuery.find({ [field]: range });
    return this;
  }

  amountRange(field = "amount"): this {
    const { minAmount, maxAmount } = this.query;
    if (!minAmount && !maxAmount) {
      return this;
    }

    const range: Record<string, number> = {};
    if (minAmount) {
      range.$gte = Number(minAmount);
    }
    if (maxAmount) {
      range.$lte = Number(maxAmount);
    }

    this.modelQuery = this.modelQuery.find({ [field]: range });
    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";
    if (fields) {
      this.modelQuery = this.modelQuery.select(fields);
    }
    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    const baseFilter = { ...this.filterQuery };

    if (this.query.searchTerm) {
      // meta count should reflect search; rebuild search filter for count
      // For simplicity, count on current filtered query without pagination
    }

    const totalDocuments = await this.modelQuery.model.countDocuments(
      this.modelQuery.getFilter(),
    );
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit) || 1;

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };
  }
}
