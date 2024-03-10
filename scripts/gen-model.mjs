import { existsSync, mkdirSync, writeFileSync } from 'fs';
import readline from 'readline';

// toSnakeCase converts given camelcase to snake case
const camelCaseToSnakeCase = (camelCase) => {
  let word = '';
  let snakeCasePath = [];
  for (const char of camelCase.split('')) {
    if (char.match(/[A-Z]/)) {
      snakeCasePath.push(word);
      word = char.toLowerCase();
    } else {
      word += char;
    }
  }
  if (word) {
    snakeCasePath.push(word);
  }
  return snakeCasePath.filter(e => e).join('-');
}

// extractDirPathFromFile extract dir path from a given file location
const extractDirPathFromFile = (file) => {
  const path = [];
  const tokens = file.split('/');
  for (let i = 0; i < tokens.length - 1; i++) {
    path.push(tokens[i]);
  }
  return path.join('/');
}

// prompt is helper function which asks a question and returns back response from the user
const prompt = async (question) => {
  const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((res, rej) => {
    read.question(
      `${question} `,
      (data) => {
        if (!data) {
          rej('no input entered');
        } else {
          res(data.trim());
        }
        read.close();
      },
    );
  });
}

// writeIfNotExists writes to given file location if it doesn't already exist
const writeIfNotExists = (fileLocation, contents, failIfExists = false) => {
  // Ensure dir location for the file exists
  const dir = extractDirPathFromFile(fileLocation);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir);
  }

  // If the file location already exists
  if (existsSync(fileLocation)) {
    if (failIfExists) {
      throw new Error(`${fileLocation} already exists, failing`);
    }
    console.log(`[eexists] skipping ${fileLocation}`);
    return;
  }

  // write contents to the file location
  writeFileSync(fileLocation, contents + '\n');
  console.log(`[success] created ${fileLocation}`);
}

// domainCode generates code for given domain
const domainCode = (domain) => {
  return `
package domain
// ${domain} defines structure for the domain ${domain}
type ${domain} struct{}
`.trim();
};

// serviceCode generates code for service for a given domain, attaching all provided actions
const serviceCode = (actions, domain) => {
  const short = domain.match(/[A-Z]/g).join('').toLowerCase() + 'Svc';

  // attached actions
  const actionsCode = actions.map(action => {
    return `
// ${action} action for ${domain}
func (${short} *${domain}ServiceImpl) ${action}(ctx context.Context, data *domain.${domain}) error {
	return nil
}
`.trim();
  }).join('\n\n');

  // interface's inner definition for the given service
  const interfaceDef = actions.map(action => {
    return `${action}(ctx context.Context, data *domain.${domain}) error`
  }).join('\t\n');

  return `
package services
import (
	"context"
	"flashcards/logger"
	"flashcards/domain"
)
// ${domain}Service defines the service layer contract for ${domain}
type ${domain}Service interface {
	${interfaceDef}
}
// ${domain}ServiceImpl is the service layer for ${domain}
type ${domain}ServiceImpl struct {
	logger *logger.Logger
}
${actionsCode}
// New${domain}Service is the constructor for ${domain}Service
func New${domain}Service(logger *logger.Logger) ${domain}Service {
	return &${domain}ServiceImpl{logger: logger}
}
`.trim();
}

// controllerCode generates code for given action on domain
const controllerCode = (action, domain) => {
  // Operation is concated action and domain
  const operation = action + domain;

  // Short is used for referencing struct when attaching methods to operation
  const short = operation.match(/[A-Z]/g).join('').toLowerCase() + 'Ctrl';

  // Variables begin with small character, eg CreateUser -> createUser
  const beginSmall = operation[0].toLowerCase() + action.slice(1);

  return `
package controllers
import (
	"context"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
	"flashcards/domain"
	"flashcards/logger"
	"flashcards/services"
)
// ${operation}Controller defines the controller for handling ${operation}
type ${operation}Controller struct {
	svc    services.${domain}Service
	logger *logger.Logger
	DefaultController
}
// ${operation}ControllerRequest defines the incoming request for ${operation}Controller
type ${operation}ControllerRequest struct {
	Data *domain.${domain} \`validate:"required" json:"${domain}"\`
}
// NewRequest creates the incoming request for ${operation}Controller
func (${short} *${operation}Controller) NewRequest() *domain.Request {
	return &domain.Request{
		Body: &${operation}ControllerRequest{},
	}
}
// ValidateRequest validates incoming request for ${operation}Controller
func (${short} *${operation}Controller) ValidateRequest(ctx context.Context, req *domain.Request) error {
	validate := validator.New()
	body := req.Body.(*${operation}ControllerRequest)
	return validate.Struct(body)
}
// Handler handles the request for ${operation}Controller
func (${short} *${operation}Controller) Handler(ctx context.Context, request *domain.Request) (interface{}, error) {
	${beginSmall}Request := request.Body.(*${operation}ControllerRequest)
	err := ${short}.svc.${action}(ctx, ${beginSmall}Request.Data)
	if err != nil {
		${short}.logger.Log.Info("${operation} failed", zap.Any("request", request), zap.Any("error", err))
		return nil, err
	}
	return map[string]interface{}{"data": ${beginSmall}Request.Data}, nil
}
// New${operation}Controller is the constructor for ${operation}Controller
func New${operation}Controller(svc services.${domain}Service, logger *logger.Logger) *${operation}Controller {
	return &${operation}Controller{
		svc:    svc,
		logger: logger,
	}
}
`.trim();
};

async function main() {
  console.log('Welcome to your friendly Golang service scaffolder.');

  const domain = await prompt('Please enter domain name (eg User):');
  const actions = await prompt('Provide actions (comma separated) on domains (eg Create/Update/Delete etc):')
    .then(raw => raw.split(',').map(e => e.trim()));

  const snakeCaseDomain = camelCaseToSnakeCase(domain);
  writeIfNotExists(`./domain/${snakeCaseDomain}.go`, domainCode(domain));
  writeIfNotExists(`./services/${snakeCaseDomain}-service.go`, serviceCode(actions, domain));
  for (const action of actions) {
    writeIfNotExists(`./controllers/${camelCaseToSnakeCase(action + domain)}.go`, controllerCode(action, domain));
  }
}

main();