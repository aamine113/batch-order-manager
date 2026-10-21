import { SchemaOptions } from '@nestjs/mongoose';

// Options shared by every schema: automatic createdAt/updatedAt, no __v field,
// and `id` (a string) in JSON responses instead of `_id`.

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_doc, ret) => {
      const { _id, ...rest } = ret;
      return {
        id: String(_id),
        ...rest,
      };
    },
  },
};
