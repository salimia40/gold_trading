import { FileUpload, GraphQLUpload } from "graphql-upload";
import { asNexusMethod } from "nexus";

export type Upload = Promise<FileUpload>;
// Bang is required due to https://github.com/apollographql/apollo-server/blob/570f548b88750a06fbf5f67a4abe78fb0f870ccd/packages/apollo-server-core/src/index.ts#L49-L56
export const Upload = asNexusMethod(GraphQLUpload!, "upload");
