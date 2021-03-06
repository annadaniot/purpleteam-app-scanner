const Joi = require('joi');
const WebDriverFactory = require(`${process.cwd()}/src/drivers/webDriverFactory`);
const browser = require(`${process.cwd()}/src/clients/browser`);
const config = require(`${process.cwd()}/config/config`);
let log;

// Todo: KC: Will need quite a bit of testing around schemas.
const sutSchema = {

  protocol: Joi.string().required().valid('https', 'http'),
  ip: Joi.string().ip().required(),
  port: Joi.number().port().required(),
  browser: Joi.string().valid(config.getSchema().properties.sut.properties.browser.format).lowercase().default(config.get('sut.browser')),
  loggedInIndicator: Joi.string(),
  context: Joi.object({
    iD: Joi.number().integer().positive(),
    name: Joi.string().token()
  }),
  authentication: Joi.object({
    route: Joi.string().min(2).regex(/^\/[a-z]+/i),
    usernameFieldLocater: Joi.string().min(2).required(),
    passwordFieldLocater: Joi.string().min(2).required(),
    submit: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required()
  }),
  reportFormats: Joi.array().items(Joi.string().valid(config.getSchema().properties.sut.properties.reportFormat.format).lowercase()).unique().default([config.get('sut.reportFormat')]),  
  testSession: Joi.object({
    type: Joi.string().valid('testSession').required(),
    id: Joi.string().alphanum(),
    attributes: Joi.object({
      username: Joi.string().min(2),
      password: Joi.string().min(2),
      aScannerAttackStrength: Joi.string().valid(config.getSchema().properties.sut.properties.aScannerAttackStrength.format).uppercase().default(config.get('sut.aScannerAttackStrength')),
      aScannerAlertThreshold: Joi.string().valid(config.getSchema().properties.sut.properties.aScannerAlertThreshold.format).uppercase().default(config.get('sut.aScannerAlertThreshold')),
      alertThreshold: Joi.number().integer().positive().default(config.get('sut.alertThreshold'))
    }),
    relationships: Joi.object({
      data: Joi.array().items(Joi.object({
        type: Joi.string().valid('route').required(),
        id: Joi.string().min(2).regex(/^\/[a-z]+/i).required()
      }))
    })
  }),
  testRoutes: Joi.array().items(Joi.object({
    type: Joi.string().valid('route').required(),
    id: Joi.string().min(2).regex(/^\/[a-z]+/i).required(),
    attributes: Joi.object({      
      attackFields: Joi.array().items(Joi.object({
        name: Joi.string().min(2).regex(/^[a-z0-9_-]+/i).required(),
        value: Joi.string().empty('').default(''),
        visible: Joi.boolean()
      })),
      method: Joi.string().valid(config.getSchema().properties.sut.properties.method.format).uppercase().default(config.get('sut.method')),
      submit: Joi.string().min(2).regex(/^[a-z0-9_-]+/i)
    })
  }))
};


let properties;
let webDriver;


const validateProperties = (sutProperties) => {
  const result = Joi.validate(sutProperties, sutSchema);
  if(result.error) {
    log.error(result.error.message, {tags: ['testing', 'validation']});
    throw new Error(result.error.message);
  }
  return result.value;
};


const initialiseProperties = (sutProperties) => {
  properties = validateProperties(sutProperties);  
};


const init = (options) => {
  log = options.log;
  initialiseProperties(options.sutProperties);
};


const getProperties = (selecter) => {
  if(!selecter)
    return properties;
  if(typeof selecter === 'string')
    return properties[selecter];
  if(Array.isArray(selecter))
    return selecter.reduce( (accumulator, propertyName) => ({ ...accumulator, [propertyName]: properties[propertyName] }), {});  
};


const initialiseBrowser = async (slaveProperties) => {
  const webDriverFactory = new WebDriverFactory();

  webDriver = await webDriverFactory.webDriver({
    log,
    browser: properties.browser,
    slave: slaveProperties
  });

  browser.init({log, webDriver});
};


module.exports = {
  validateProperties,
  init,
  properties,
  initialiseBrowser,
  getProperties,
  baseUrl: () => `${properties.protocol}://${properties.ip}:${properties.port}`,
  getBrowser: () => browser
};
