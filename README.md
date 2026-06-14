# Bank Transaction System API

Welcome to the Bank Transaction System API! This backend provides a robust set of endpoints to manage users, accounts, ledgers, and transactions. It is built using Node.js, Express, and MongoDB, utilizing ACID transactions to ensure financial data integrity.

## Base URL
The API is deployed and accessible at:
**`https://bank-transaction-rs7y.onrender.com/api`**

---

## API Endpoints

### Authentication (`/api/auth`)
*   **POST `/register`**
    *   Creates a new user account.
    *   **Body:** `{ "name": "John Doe", "email": "john@example.com", "password": "securepassword" }`
*   **POST `/login`**
    *   Authenticates a user and starts a session (sets cookies).
    *   **Body:** `{ "email": "john@example.com", "password": "securepassword" }`
*   **POST `/logout`**
    *   Logs out the current user and clears the session cookie.

### Accounts (`/api/accounts`)
*   **POST `/`** *(Requires Auth)*
    *   Creates a new bank account associated with the authenticated user.
*   **GET `/`** *(Requires Auth)*
    *   Retrieves the account details of the authenticated user.
*   **GET `/balance/:accountId`** *(Requires Auth)*
    *   Retrieves the current balance of a specific account calculated from the ledger.

### Transactions (`/api/transactions`)
*   **POST `/`** *(Requires Auth)*
    *   Initiates a money transfer from one account to another. Includes an idempotency key to prevent double-charging.
    *   **Body:** `{ "fromAccount": "id1", "toAccount": "id2", "amount": 100, "idempotencyKey": "unique-uuid" }`
*   **POST `/system/initial-funds`** *(Requires System Auth)*
    *   Used by system admins to fund an account initially.
    *   **Body:** `{ "toAccount": "id1", "amount": 1000, "idempotencyKey": "unique-uuid" }`

---

## How to use this API in a Frontend Application

To consume this API from a frontend (e.g., React, Vue, or Vanilla JS), you can use the built-in `fetch` API or a library like `axios`. 

### Important Note on Authentication
Since the API uses cookies for session management (handled via `cookie-parser`), make sure your frontend HTTP client is configured to **include credentials** (cookies) in cross-origin requests.

### Example: Logging in a User (using `fetch`)

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch('https://bank-transaction-rs7y.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // IMPORTANT: Include credentials to accept the session cookie!
      credentials: 'include', 
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful!', data);
    } else {
      console.error('Login failed');
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Example: Initiating a Transaction (using `fetch`)

```javascript
async function sendMoney(fromAccountId, toAccountId, amount) {
  try {
    // Generate a unique ID to prevent double transfers if the network fails
    const idempotencyKey = crypto.randomUUID(); 

    const response = await fetch('https://bank-transaction-rs7y.onrender.com/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Needed to pass the auth cookie
      body: JSON.stringify({
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        amount: amount,
        idempotencyKey: idempotencyKey
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Transfer successful!', data);
    } else {
      console.error('Transfer failed:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```
