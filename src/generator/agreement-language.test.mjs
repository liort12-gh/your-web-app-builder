import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./proposal-generator.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('const LEGAL_MERCHANT ='), html.indexOf('function pgAgreement()'));
const legal = runInNewContext(`${source}\n({agreementText, LEGAL_MERCHANT, LEGAL_PARTNER, LEGAL_MERCHANT_EN, LEGAL_PARTNER_EN})`);

for (const type of ['merchant', 'partner']) {
  test(`${type} agreement follows English selection and switches back to Dutch`, () => {
    const nl = legal[`LEGAL_${type.toUpperCase()}`];
    const en = legal[`LEGAL_${type.toUpperCase()}_EN`];
    assert.notEqual(nl, en);
    assert.equal(legal.agreementText(type, 'en'), en);
    assert.equal(legal.agreementText(type, 'nl'), nl);
  });
}