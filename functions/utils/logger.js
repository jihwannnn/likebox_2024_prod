const { logger, params } = require("firebase-functions/v2");

// logger: platform

const logPlatformStart = (platform, functionName) => {
  logger.info(`Platform phase start: ${platform}, ${functionName}`);
};

const logPlatformFinish = (platform, functionName) => {
  logger.info(`Platform phase finish: ${platform}, ${functionName}`);
};

const logPlatformError = (platform, functionName, error) => {
  logger.error(`Error in Platform, ${platform}, ${functionName}: `, error);
};

// logger: service

const logServiceStart = (functionName) => {
  logger.info(`Service phase start: ${functionName}`);
};

const logServiceFinish = (functionName) => {
  logger.info(`Service phase finish: ${functionName}`);
};

const logServiceError = (functionName, error) => {
  logger.error(`Error in Service, ${functionName}: `, error);
};

// logger: controller

const logControllerStart = (functionName) => {
  logger.info(`Controller phase start: ${functionName}`);
};

const logControllerFinish = (functionName) => {
  logger.info(`Controller phase finish: ${functionName}`);
};

const logControllerError = (functionName, error) => {
  logger.error(`Error in Controller, ${functionName}: `, error);
};

// logger: test
const logTestStart = (functionName, params) => {
  logger.info('=================== TEST LOG START ===================');
  logger.info(`Test function called: ${functionName}`);
  logger.info('Parameters:', params);
  logger.info('Timestamp:', new Date().toISOString());
};

const logTestFinish = (functionName, result) => {
  logger.info(`Test function completed: ${functionName}`);
  logger.info('Result:', result);
  logger.info('=================== TEST LOG END ===================');
};

const logTestError = (functionName, error) => {
  logger.error('=================== TEST ERROR START ===================');
  logger.error(`Error in test function: ${functionName}`);
  logger.error('Error details:', error);
  logger.error('Stack trace:', error.stack);
  logger.error('=================== TEST ERROR END ===================');
};

const logInfo = (functionName, params) => {
  logger.info("Function: ", functionName);
  logger.info("Parameter: ", params);
}

module.exports = {
  logPlatformStart,
  logPlatformFinish,
  logPlatformError,
  logServiceStart,
  logServiceFinish,
  logServiceError,
  logControllerStart,
  logControllerFinish,
  logControllerError,
  logTestStart,
  logTestFinish,
  logTestError,
  logInfo
};