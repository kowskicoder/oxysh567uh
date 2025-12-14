
# Payment Flow Testing Guide for BetChat

## Prerequisites
1. Ensure `PAYSTACK_SECRET_KEY` is set in Replit Secrets
2. Have test Paystack API keys (not production keys)
3. Use Paystack test card numbers for safe testing

## Test Card Numbers (Paystack Test Environment)
- **Successful payments**: 4084084084084081
- **Insufficient funds**: 4084084084084085
- **Invalid card**: 4084084084084089
- **Declined transaction**: 4084084084084087

## Test Scenarios

### 1. Deposit Flow Testing

#### Test Case 1: Successful Deposit
1. Navigate to `/wallet`
2. Click "Deposit" button
3. Enter amount: ₦1000
4. Click "Deposit" - should redirect to Paystack
5. Use test card: 4084084084084081
6. Complete payment
7. Verify redirect back to wallet page
8. Check transaction appears in history
9. Verify balance updated correctly

#### Test Case 2: Failed Deposit
1. Navigate to `/wallet`
2. Click "Deposit" button
3. Enter amount: ₦500
4. Click "Deposit" - should redirect to Paystack
5. Use declined card: 4084084084084087
6. Verify graceful error handling
7. Check no transaction recorded for failed payment

#### Test Case 3: Invalid Amount
1. Try depositing ₦0 or negative amount
2. Verify validation error shown
3. Try depositing extremely large amount
4. Verify appropriate handling

### 2. Withdrawal Flow Testing

#### Test Case 1: Successful Withdrawal
1. Ensure sufficient balance (deposit first if needed)
2. Click "Withdraw" button
3. Enter valid amount less than balance
4. Submit withdrawal request
5. Verify transaction recorded as "pending"
6. Check balance temporarily reduced

#### Test Case 2: Insufficient Funds
1. Try withdrawing more than current balance
2. Verify error message displayed
3. Check no transaction created

### 3. Webhook Testing

#### Test Case 1: Webhook Verification
1. Use Paystack's webhook test tool
2. Send test webhook with valid signature
3. Verify transaction updates correctly
4. Check user balance reflects payment

#### Test Case 2: Invalid Webhook
1. Send webhook with invalid signature
2. Verify request rejected (400 status)
3. Check no unauthorized transactions processed

### 4. Edge Cases

#### Test Case 1: Network Interruption
1. Start deposit process
2. Simulate network disconnection
3. Verify transaction state handling
4. Test recovery when connection restored

#### Test Case 2: Concurrent Transactions
1. Attempt multiple deposits simultaneously
2. Verify all transactions processed correctly
3. Check for race conditions in balance updates

## Automated Testing Commands

Run these tests to verify payment integration:
```bash
# Test webhook endpoint
curl -X POST http://localhost:5000/api/webhook/paystack \
  -H "Content-Type: application/json" \
  -H "X-Paystack-Signature: test_signature" \
  -d '{"event":"charge.success","data":{"reference":"test_ref","amount":100000,"metadata":{"userId":"test_user"}}}'

# Test deposit endpoint
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"amount":1000}'
```

## Manual Testing Checklist

### Before Testing
- [ ] Set PAYSTACK_SECRET_KEY in Secrets
- [ ] Verify using Paystack test environment
- [ ] Clear previous test data if needed

### Deposit Testing
- [ ] UI validation works (negative amounts, etc.)
- [ ] Paystack popup appears correctly
- [ ] Test cards work as expected
- [ ] Successful payments update balance
- [ ] Failed payments don't affect balance
- [ ] Transaction history accurate
- [ ] Webhook processes correctly

### Withdrawal Testing
- [ ] Balance validation works
- [ ] Withdrawal requests created
- [ ] Status shows as "pending"
- [ ] Cannot withdraw more than balance
- [ ] Transaction history updated

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid signatures rejected
- [ ] Malformed requests handled
- [ ] User-friendly error messages shown

## Production Considerations

### Security Checks
- [ ] Webhook signature verification working
- [ ] No sensitive data in client-side code
- [ ] Transaction amounts validated server-side
- [ ] Rate limiting considered

### Performance
- [ ] Payment flows respond quickly
- [ ] Database queries optimized
- [ ] Webhook processing efficient

### Monitoring
- [ ] Log all payment attempts
- [ ] Track failed transactions
- [ ] Monitor webhook delivery
- [ ] Set up alerting for payment issues
