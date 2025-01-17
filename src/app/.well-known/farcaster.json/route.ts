import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOiA4ODcyNDYsICJ0eXBlIjogImN1c3RvZHkiLCAia2V5IjogIjB4N0Q0MDBGRDFGNTkyYkI0RkNkNmEzNjNCZkQyMDBBNDNEMTY3MDRlNyJ9",
      payload: "eyJkb21haW4iOiAiZWJlZXp5ZXRoLXBpeGVscHVyc3VpdC1hZHZlbnR1cmUudmVyY2VsLmFwcCJ9",
      signature: "MHhmZjg3YTIxODg5NTE0OTRhYzgzNDJjYTdkMzhlYjJkNGM1Zjg5ODdiOWRiMDBjNDE0YmNjN2RkYWExMzE1ZGFjM2IxYTg3YmEyM2U1MGFjNWUzMmQzMmEzNWExNWQyMjJlNjc2MTczNGQ3ZTViMzQ4N2VjNzFiMjViZGQ3ZWI3MzFi"
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/frames/hello/opengraph-image`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
