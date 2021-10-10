import Flow from './flow'

describe('flow tests', () => {
  let flow = new Flow();
  test('return module', () => {
    expect(flow.module()).toHaveProperty('apply');
  });

  test('return module', () => {
    expect(flow.updateMeta).toBeDefined();
  });
});
