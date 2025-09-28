import { describe, expect, it } from 'vitest';

import { GenerateQrCode, Tag, Tags } from '../../src';

const LATIN_EXPECTED = 'AQVTYWxsYQIKMTIzNDU2Nzg5MQMUMjAyMS0wNy0xMlQxNDoyNTowOVoEBjEwMC4wMAUFMTUuMDA=';
const ARABIC_EXPECTED = 'AQbYs9mE2KkCCjEyMzQ1Njc4OTEDFDIwMjEtMDctMTJUMTQ6MjU6MDlaBAYxMDAuMDAFBTE1LjAw';
const DATA_URL_EXPECTED =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM0AAADNCAIAAACU3mM+AAAABnRSTlMA/wD/AP83WBt9AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEkUlEQVR4nO3dy27kKABA0cmo//+X03svkBBwTVWfs03qkdQVsssYfn5/f/+Dw/5/+w3wT9AZBZ1R0BkFnVHQGQWdUdAZBZ1R0BkFnVHQGQWdUdAZBZ1R0BkFnVHQGQWdUfiz8uCfn59d72PscRPD43XHP82eeeVtjJ9q7K1PYYrxjILOKOiMgs4oLJ0HPGy85XjqiHvjC2185pVj+ZU/P/sUphjPKOiMgs4o6IzCzvOAh5Xv5aee+fHYjQfgG5955eB95Xj83KcwxXhGQWcUdEZBZxQOngdkpo64p2b+rFwt2DhN6AsYzyjojILOKOiMwjecB4yND8BXpvxvPC34+pMG4xkFnVHQGQWdUTh4HnBuksnK7bsPb025mZomlN1yfI7xjILOKOiMgs4o7DwPyL7Fnvoy/c61hjZeaXi481qC8YyCzijojILOKPxc8n3xio2Lfa4887mD9y/4jIxnFHRGQWcUdEZh6Tzg3HyVSw7Ax1be1covj9/G1GPHT7Xx/2w8o6AzCjqjoDMKt1wPODddZ6NL3uS5iwfndlMwnlHQGQWdUdAZhZ3XA+7c3iu7aLHy2Gwu09i5MwzjGQWdUdAZBZ1R2Hk94K3bdzce6k7ZeJaQXWnIJlw9GM8o6IyCzijojMJr84I2HpB+4hJA505HLpm89GA8o6AzCjqjoDMKl94nPPW62aHuua/Lxy/08NbFEvOCuJ3OKOiMgs4o7Nw/4Nz8nHNr70wd+V4yXWfqhS65xdp4RkFnFHRGQWcUDu4nPD62XTnkfOsCwMpTTT3zxhda+V9ZN5QPozMKOqOgMwoH1ws6t7FtNtd+ysbJPBud211givGMgs4o6IyCzigcvB6QbaS10bntvc4tHzT+6dRfZF4Qn01nFHRGQWcUls4DLlnd89yX+NmR/viXp9y5IYTxjILOKOiMgs4oHFwv6Av2xtq4INIlS5Ce2xltzHhGQWcUdEZBZxRe20dsysbtrrKF+6cee85ba7s+GM8o6IyCzijojEJ3PWCjS9YcnbJxo4KNs3eyT9B4RkFnFHRGQWcUDu4nfMlMmIe3/t6pxz5kV1amHjvFeEZBZxR0RkFnFHauF/TW+p2XnEOsfGuf3UWcbYn8YDyjoDMKOqOgMwoH9w8Y//LDJVsCZPfc3sm6oXw2nVHQGQWdUTg4L+icc+vnvHUt4dwNAef+G1OMZxR0RkFnFHRG4eB9whu9tZ/XlEvm+Gd/7xTjGQWdUdAZBZ1R2Hl/wLklSDe+jY/4Xn7KR9wuYDyjoDMKOqOgMwo7zwMe7lxPf+zcxJiV1314a3rSCuMZBZ1R0BkFnVE4eB5wztRhcrb77sYJOee2Yn6L8YyCzijojILOKHzkecDDytfW4yPuc7P4N26fMP7lcwsxTTGeUdAZBZ1R0BmFg+cBb031WZncsnLUnN2Ru/G0YMx6QXwYnVHQGQWdUbh0H7GV171zys3Gs4S3TjhWGM8o6IyCzijojMJH7h/AxzGeUdAZBZ1R0BkFnVHQGQWdUdAZBZ1R0BkFnVHQGQWdUdAZBZ1R0BkFnVHQGQWdUfgLoOr+eP/ycgUAAAAASUVORK5CYII=';

describe('GenerateQrCode', () => {
  it('encodes TLV data into base64', () => {
    const generated = GenerateQrCode.fromArray([
      new Tag(1, 'Salla'),
      new Tag(2, '1234567891'),
      new Tag(3, '2021-07-12T14:25:09Z'),
      new Tag(4, '100.00'),
      new Tag(5, '15.00')
    ]).toBase64();

    expect(generated).toBe(LATIN_EXPECTED);
  });

  it('encodes Arabic payloads identically to the legacy implementation', () => {
    const generated = GenerateQrCode.fromArray([
      new Tag(1, 'سلة'),
      new Tag(2, '1234567891'),
      new Tag(3, '2021-07-12T14:25:09Z'),
      new Tag(4, '100.00'),
      new Tag(5, '15.00')
    ]).toBase64();

    expect(generated).toBe(ARABIC_EXPECTED);
  });

  it('supports the semantic tag helpers', () => {
    const generated = GenerateQrCode.fromArray([
      new Tags.Seller('Salla'),
      new Tags.TaxNumber('1234567891'),
      new Tags.InvoiceDate('2021-07-12T14:25:09Z'),
      new Tags.InvoiceTotalAmount('100.00'),
      new Tags.InvoiceTaxAmount('15.00')
    ]).toBase64();

    expect(generated).toBe(LATIN_EXPECTED);
  });

  it('renders the QR code as a PNG data URL', async () => {
    const generated = await GenerateQrCode.fromArray([
      new Tags.Seller('Salla'),
      new Tags.TaxNumber('1234567891'),
      new Tags.InvoiceDate('2021-07-12T14:25:09Z'),
      new Tags.InvoiceTotalAmount('100.00'),
      new Tags.InvoiceTaxAmount('15.00')
    ]).render();

    expect(generated).toBe(DATA_URL_EXPECTED);
  });

  it('rejects malformed payloads', () => {
    expect(() => GenerateQrCode.fromArray([null as unknown as Tag]).toBase64()).toThrowError(
      'malformed data structure'
    );
  });
});
