export const Share = {
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
  dismiss: jest.fn().mockResolvedValue(undefined),
  sharedAction: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}
