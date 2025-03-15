import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "course" model, go to https://eduplanner.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "X_KY0LGvTE2G",
  comment:
    "Represents a course that a user can add to their profile, capturing essential details such as name, code, and duration.",
  fields: {
    code: {
      type: "string",
      validations: { required: true },
      storageKey: "CHImcvX5AOhn",
    },
    color: { type: "color", storageKey: "wWoOkP49eOQJ" },
    description: { type: "string", storageKey: "wGtpPTTZAhSF" },
    endDate: {
      type: "dateTime",
      includeTime: true,
      storageKey: "3XV2-5dLU5hq",
    },
    name: {
      type: "string",
      validations: { required: true },
      storageKey: "c5f-HoExaFVZ",
    },
    startDate: {
      type: "dateTime",
      includeTime: true,
      storageKey: "xgic1GD1udMP",
    },
    syllabus: {
      type: "file",
      allowPublicAccess: false,
      storageKey: "5DfNP7tiIpSi",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "wjLsWWLUPKPX",
    },
  },
};
