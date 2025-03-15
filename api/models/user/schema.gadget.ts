import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://eduplanner.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DoY16uzT1q0x",
  fields: {
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "Z00NWuuaxSdO",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "-prnTpsoGNhv",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "ZcYNLUKsQClW",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "1W_s0dRQLJFM",
    },
    firstName: { type: "string", storageKey: "nGMJ6HxgPDEX" },
    googleImageUrl: { type: "url", storageKey: "5_pYztxDcgO0" },
    googleProfileId: { type: "string", storageKey: "pPa1sNQhENOm" },
    lastName: { type: "string", storageKey: "6loL4BRrb8B2" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "6QJ8UcIYT6Ok",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "4tMREdhADu5p",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "d10kwTqZAkZy",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "qog6eVzt2ioi",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "3NrT9NwZmUDF",
    },
  },
};
