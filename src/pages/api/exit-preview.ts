import { NextApiRequest, NextApiResponse } from 'next';

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
