import cheerio from 'cheerio';
import axios from 'axios';

const USCIS_CASE_STATUS_PAGE_URL = 'https://egov.uscis.gov/casestatus/mycasestatus.do';

export async function getCaseStatus(
  appReceiptNum: string,
): Promise<{ headingText: string; bodyText: string }> {
  const url = `${USCIS_CASE_STATUS_PAGE_URL}?appReceiptNum=${appReceiptNum}`;
  const { data } = await axios.post(url);
  const $ = cheerio.load(data);
  const $heading = $('.appointment-sec h1');

  return {
    headingText: $heading.text(),
    bodyText: $heading.next('p').text(),
  };
}
