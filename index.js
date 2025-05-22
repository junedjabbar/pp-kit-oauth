import express from 'express';
import axios from 'axios';

const app = express()
const port = 3001

// Cognito Configuration
const CLIENT_ID = '5t0e0nahlrnedffj68ouo26cpf';  // Replace with your actual client ID
const CLIENT_SECRET = '12s0pl46lp4cpkgojapmsvt24urp2r2rh0rulrjp41jb6kh3g76c';  // Replace with your actual client secret
const COGNITO_DOMAIN = 'auth.getpoln.com';  // Replace with your actual Cognito domain
const COGNITO_BASE_URI = `https://${COGNITO_DOMAIN}`;
const REDIRECT_URI = 'https://app.kit.com/apps/install';  // Kit's redirect URI

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function safeStringify(obj) {
  const seen = new Set()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }

    return value
  }, 3)
}

function getUrl() {
  // if (process.env.PB_PROFILE === 'local') {
  //   return 'http://localhost:3002/a'
  // }
  return 'https://api.getpoln.com'
}

const executeApiCall = async (token, url) => {
  try {
    const finalUrl = `${getUrl()}${url}`
    const res = await axios.get(finalUrl, {
      headers: {
        'Authorization': token
      },
    });
    return res.data
  } catch (e) {
    logger.info(`An exception ocurred while making api call:`, e)
  }
  return {}
}

const getDealsHtml2 = (products, settings) => {
  const {
    affiliateTag,
    titleLine1 = '',
    titleFontSize = '18px',
    titleFontColor = '#000000',
    titleFontStyle = 'italic',
    titleBackgroundColor = '#c2c2f7',

    // fontFamily now object: { fontFamily, fontWeight }
    titleFontFamily = { fontFamily: 'Arial, sans-serif', fontWeight: 'normal' },

    productTitleColor = '#6366f1',
    productTitleSize = '14px',
    productTitleFontFamily = { fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },

    buttonBackground = '#6366f1',
    buttonStyle = 'solid',
    buttonTextColor,
    buttonFontSize = '12px',
    buttonFontFamily = { fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },

    cardBackgroundColor = '#ffffff',
    discountColor = 'red',
    discountFontSize = '14px',
    discountFontFamily = { fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },

    imageBackgroundColor = '',
    bodyBackgroundColor = '#ffffff',

    buttonText = 'SHOP NOW'
  } = settings;

  // Extract font-family and font-weight for title, product title, button, discount
  const titleFontFamilyStr = titleFontFamily.fontFamily || 'Arial, sans-serif';
  const titleFontWeightStr = titleFontFamily.fontWeight || 'normal';

  const productTitleFontFamilyStr = productTitleFontFamily.fontFamily || 'Arial, sans-serif';
  const productTitleFontWeightStr = productTitleFontFamily.fontWeight || 'bold';

  const buttonFontFamilyStr = buttonFontFamily.fontFamily || 'Arial, sans-serif';
  const buttonFontWeightStr = buttonFontFamily.fontWeight || 'bold';

  const discountFontFamilyStr = discountFontFamily.fontFamily || 'Arial, sans-serif';
  const discountFontWeightStr = discountFontFamily.fontWeight || 'bold';

  const isOutline = buttonStyle === 'outline';
  const finalButtonBackground = isOutline ? 'transparent' : buttonBackground;
  const finalButtonBorder = isOutline ? `1px solid ${buttonBackground}` : 'none';
  const finalButtonTextColor = isOutline
    ? (buttonTextColor || buttonBackground)
    : (buttonTextColor || '#ffffff');

  const truncate = (text, fontSizePx = 14, containerWidthPx = 180, lines = 2) => {
    const avgCharWidth = fontSizePx * 0.5;
    const maxChars = Math.floor((containerWidthPx / avgCharWidth) * lines);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3).trim() + '...';
  };

  const filteredProducts = products.slice(0, 9);
  const rows = [];
  for (let i = 0; i < filteredProducts.length; i += 3) {
    const rowItems = filteredProducts.slice(i, i + 3).map(product => {
      const {
        title = product?.title,
        image = product?.image,
        percentageOff = product?.percentage,
        url,
      } = product;

      const link = affiliateTag ? url.replace('getpoln-20', affiliateTag) : url;
      const displayTitle = truncate(title, parseInt(productTitleSize), 180, 2);

      return `
        <td width="33.33%" style="padding: 10px; text-align: center;">
          <div style="background: ${cardBackgroundColor}; padding: 12px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); position: relative;">
            <div style="position: relative; background: ${imageBackgroundColor || 'transparent'}; border-radius: 4px;">
              <img src="${image}" alt="${title}" class="datadyno-img" />
              <div style="position: absolute; top: 8px; right: 8px; background: ${discountColor}; color: white; font-size: ${discountFontSize}; font-family: ${discountFontFamilyStr}; font-weight: ${discountFontWeightStr}; padding: 2px 6px; border-radius: 3px;">
                ${percentageOff}% OFF
              </div>
            </div>
            <p style="font-size: ${productTitleSize}; color: ${productTitleColor}; font-weight: ${productTitleFontWeightStr}; font-family: ${productTitleFontFamilyStr}; margin: 12px auto 8px; max-width: 180px; word-wrap: break-word;">
              ${displayTitle}
            </p>
            <a href="${link}" style="
                font-family: ${buttonFontFamilyStr};
                font-weight: ${buttonFontWeightStr};
                display: inline-block;
                padding: 4px 10px;
                border: ${finalButtonBorder};
                background: ${finalButtonBackground};
                text-decoration: none;
                color: ${finalButtonTextColor};
                border-radius: 5px;
                font-size: ${buttonFontSize};
              ">
                ${buttonText}
              </a>
          </div>
        </td>
      `;
    }).join('');

    const columnCount = filteredProducts.slice(i, i + 3).length;
    const totalColumns = 3;
    const emptyCells = totalColumns - columnCount;
    const emptyHtml = '<td width="33.33%"></td>'.repeat(Math.floor(emptyCells / 2));

    rows.push(`<tr>${emptyHtml}${rowItems}${emptyHtml}</tr>`);
  }

  return `
  <body style="Margin:0;padding:0;background-color:${bodyBackgroundColor};">
    <style>
      img.datadyno-img {
        width: 119px !important;
        height: 122px !important;
        display: block !important;
        margin: 0 auto !important;
        object-fit: contain !important;
        border-radius: 6px !important;
        background-color: #fff !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
      }
    </style>
    <table role="presentation" width="90%" border="0" cellspacing="0" cellpadding="0" style="margin: auto; font-family: ${titleFontFamilyStr}; font-weight: ${titleFontWeightStr};">
      ${titleLine1 && `<tr>
        <td align="center" style="padding: 20px 10px; background: ${titleBackgroundColor};">
          <h2 style="margin: 0; font-size: ${titleFontSize}; color: ${titleFontColor}; font-style: ${titleFontStyle}; font-weight: ${titleFontWeightStr}; font-family: ${titleFontFamilyStr};">${titleLine1}</h2>
        </td>
      </tr>`}
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows.join('')}
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 30px 10px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: auto;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px;">
                <span style="font-size: 18px;">
                  Powered by
                </span>
              </td>
              <td style="vertical-align: middle;">
                <a href="https://datadyno.co/user/deals" target="_blank" style="display: inline-block; text-decoration: none;">
                  <img src="https://res.cloudinary.com/dh5pf5on1/image/upload/v1747049158/temp/hff1b0ossms0dvgofjkz.png" alt="Brand Logo" style="width: 130px; height: 35px; display: block; border: 0;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  `;
};

app.post('/dealslist', async (request, response) => {
  console.log(`Request received for dealslist: [${safeStringify(request)}]`)

  const authHeader = request.headers;

  console.log(`AuthHeader is: ${JSON.stringify(authHeader)}`)

  const token = authHeader['x-vercel-oidc-token'];

  const apiResponse = await executeApiCall(token, '/creator/lists')

  const apiList = apiResponse?.list || []
  const output = []

  if (apiList && apiList?.length) {
    apiList.forEach(i => {
      output.push({ label: i.listName, value: i.listName })
    })
  } else {
    output.push({ label: 'Empty List', value: 'Empty List' });
  }

  logger.info(`Returning response: ${JSON.stringify(output)}`)

  return response.json({ code: 200, data: output })
})

app.post('/deals', async (request, response) => {
  const settings = request.body.settings;

  logger.info(`Received request to getDeals with params [${JSON.stringify(settings)}]`);

  const authHeader = request.headers;

  console.log(`AuthHeader is: ${JSON.stringify(authHeader)}`)

  const token = authHeader['x-vercel-oidc-token'];

  const { list } = settings;

  if (list === 'Empty List') {
    const noListHtml = `
      <body style="Margin:0;padding:20px; font-family: Arial, sans-serif; background-color: #ffffff;">
        <h2 style="text-align: center; color: #333333;">
          No deals list selected.
        </h2>
        <p style="text-align: center;">
          Please <a href="https://datadyno.co/creator/deals" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">click here</a> to create a deals list.
        </p>
      </body>
    `;
    return response.json({
      code: 200,
      html: noListHtml
    });
  }

  const url = `/creator/lists/${list}`;

  const apiResponse = await executeApiCall(token, url);

  const dealProducts = apiResponse?.products || [];

  if (dealProducts.length === 0) {
    const noProductsHtml = `
      <body style="Margin:0;padding:20px; font-family: Arial, sans-serif; background-color: #ffffff;">
        <h2 style="text-align: center; color: #333333;">
          There are no products in the list.
        </h2>
        <p style="text-align: center;">
          Please <a href="https://datadyno.co/creator/deals" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: bold;">click here</a> to add products to your deals list.
        </p>
      </body>
    `;
    return response.json({
      code: 200,
      html: noProductsHtml
    });
  }

  const html = getDealsHtml2(dealProducts, settings);

  logger.info(`Returning response: ${html}`)

  return response.json({
    code: 200,
    html
  });
});

// Route to handle the OAuth authorization request
app.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, state } = req.query;

  console.log('→ /authorize request received:', req.query);

  // Build the Cognito authorization URL
  const authorizationUrl = `${COGNITO_BASE_URI}/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;

  // Redirect to Cognito's OAuth authorization endpoint
  res.redirect(authorizationUrl);
});

// Route to handle token exchange after the user authenticates (Token URL)
app.post('/token', async (req, res) => {
  const { code } = req.body;

  console.log('→ /token request received:', req.body);

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  // Prepare the token request to Cognito
  const tokenParams = new URLSearchParams();
  tokenParams.append('grant_type', 'authorization_code');
  tokenParams.append('client_id', CLIENT_ID);
  tokenParams.append('client_secret', CLIENT_SECRET);
  tokenParams.append('code', code);
  tokenParams.append('redirect_uri', REDIRECT_URI);

  try {
    // Make the token request to Cognito's /token endpoint
    const tokenResponse = await axios.post(`${COGNITO_BASE_URI}/oauth2/token`, tokenParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('← Token response:', tokenResponse.data);

    // Return the token response to the client
    res.json(tokenResponse.data);
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.status(500).send('Token exchange failed.');
  }
});

// Start the Express server (this will be automatically handled by Vercel on deployment)
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
