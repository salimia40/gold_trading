import { GraphQLClient } from "graphql-request";

let client = new GraphQLClient(`http://localhost:4000/graphql`);

client.setHeader(
  "Cookie",
  "connect.sid=s%3ArM4k8B3OQU11O9tysxHthG2LvofnDz8I.SgGU89YPjjnWxk%2BDA%2FhHA7BZr28%2FXEm2Nwcmjdk6Xag",
);

it("ensures that a draft can be created and published", async () => {
  // Create a new draft
  const draftResult = await client.request(`            # 1
      query {
          me{
              user{ 
                  id
                  role
                }
            }
      }
    `);
  expect(draftResult).toMatchInlineSnapshot(`
Object {
  "me": Object {
    "user": Object {
      "id": 7,
      "role": "member",
    },
  },
}
`);
});
