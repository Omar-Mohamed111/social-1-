import { Model, QueryFilter, QueryOptions } from "mongoose";

export abstract class AbstractRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async update(
    filter: QueryFilter<T>,
    newData: Partial<T>,
    options: QueryOptions<T>,
  ) {
    return this.model.findByIdAndUpdate(filter, newData, options);
  }

  async delete(filter: QueryFilter<T>) {
    return this.model.deleteOne(filter);
  }

  async getOne(filter: QueryFilter<T>) {
    return this.model.findOne(filter);
  }
}
