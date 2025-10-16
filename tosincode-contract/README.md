# Tosincode Smart Contract

A Clarity smart contract for managing user profiles, achievements, and reputation system on the Tosincode platform built on Stacks blockchain.

## Overview

The Tosincode smart contract provides a decentralized system for:
- User profile management
- Achievement tracking
- Reputation scoring
- User verification
- Platform statistics

## Features

### User Management
- **Profile Creation**: Users can create profiles with unique usernames
- **Reputation System**: Track user reputation based on contributions
- **Verification**: Contract owner can verify trusted users
- **Achievement Tracking**: Award achievements to users with points

### Contract Functions

#### Public Functions

##### `create-profile`
```clarity
(create-profile (username (string-ascii 50)))
```
Creates a new user profile with the specified username.

##### `update-reputation`
```clarity
(update-reputation (user principal) (points uint))
```
Updates user reputation (owner only).

##### `add-achievement`
```clarity
(add-achievement (user principal) (achievement-id uint) (title (string-ascii 100)) (description (string-ascii 500)) (points uint))
```
Adds an achievement to a user and updates their reputation (owner only).

##### `verify-user`
```clarity
(verify-user (user principal))
```
Marks a user as verified (owner only).

##### `set-platform-fee`
```clarity
(set-platform-fee (new-fee uint))
```
Updates the platform fee (owner only, max 10%).

#### Read-Only Functions

- `get-user-profile`: Retrieve user profile information
- `get-user-achievement`: Get specific user achievement
- `get-total-users`: Get total number of registered users
- `get-platform-fee`: Get current platform fee
- `get-contract-owner`: Get contract owner address
- `user-exists`: Check if a user profile exists
- `get-user-reputation`: Get user's reputation score

## Installation & Setup

### Prerequisites
- [Clarinet](https://github.com/hirosystems/clarinet) installed
- Node.js and npm for testing
- Stacks wallet for deployment

### Local Development

1. **Clone and navigate to the project**:
   ```bash
   cd tosincode-contract
   ```

2. **Check contract syntax**:
   ```bash
   clarinet check
   ```

3. **Install dependencies for testing**:
   ```bash
   npm install
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Start local development environment**:
   ```bash
   clarinet integrate
   ```

## Contract Structure

### Data Maps
- **user-profiles**: Stores user information including username, reputation, contributions, join date, and verification status
- **user-achievements**: Tracks user achievements with titles, descriptions, and points
- **platform-stats**: General platform statistics

### Constants
- `CONTRACT_OWNER`: The deployer of the contract
- Error codes for various failure scenarios (401, 404, 400, 409)

### Data Variables
- `total-users`: Counter for total registered users
- `platform-fee`: Platform fee in basis points (default 1%)

## Usage Examples

### Creating a User Profile
```clarity
(contract-call? .tosincode create-profile "alice_dev")
```

### Getting User Information
```clarity
(contract-call? .tosincode get-user-profile 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Checking User Reputation
```clarity
(contract-call? .tosincode get-user-reputation 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Error Handling

The contract uses standardized HTTP-style error codes:
- `401`: Unauthorized access
- `404`: User not found
- `400`: Invalid input
- `409`: User already exists

## Testing

The contract includes comprehensive tests covering:
- User profile creation
- Reputation management
- Achievement system
- Error conditions
- Access control

Run tests with:
```bash
npm test
```

## Deployment

### Testnet Deployment
```bash
clarinet publish --testnet
```

### Mainnet Deployment
```bash
clarinet publish --mainnet
```

## Security Considerations

- Only the contract owner can modify user reputations and achievements
- Input validation prevents invalid data
- User existence checks prevent duplicate profiles
- Platform fee is capped at 10%

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run `clarinet check` to validate syntax
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contract Information

- **Contract Name**: tosincode
- **Version**: 1.0.0
- **Language**: Clarity
- **Blockchain**: Stacks

## API Reference

For detailed API documentation, see the inline comments in the contract file or use `clarinet docs` to generate documentation.

## Support

For questions and support:
- Create an issue in the repository
- Check existing documentation
- Join the community discussions

---

Built with ❤️ on Stacks blockchain