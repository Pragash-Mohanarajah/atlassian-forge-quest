import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);

  return 'Welcome to the ' + req.context.extension.space.key + ' space!';
});

export const handler = resolver.getDefinitions();
