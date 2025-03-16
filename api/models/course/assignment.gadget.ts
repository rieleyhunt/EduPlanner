import type { GadgetModel } from "gadget-server";

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "AssignmentStorageKey",
  comment: "Represents an assignment for a course.",
  fields: {
    date: {
      type: "dateTime",
      includeTime: true,
      storageKey: "dateStorageKey",
    },
    percentage: {
      type: "number",
      validations: {
        numberRange:{ min: 0, max: 100} 
      },
      storageKey: "percentageStorageKey",
    },
    course: {
      type: "belongsTo",
      parent: { model: "course" }, // Links assignment to course
      storageKey: "courseStorageKey",
    },
  },
};
