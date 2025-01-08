base-url=localhost:5001/whatsanalyze-80665/us-central1
base=curl -H "Origin: localhost:3000"
base-post=$(base) --header "Content-Type: application/json"

test-paypalwebhook:
	$(base-post) --location $(base-url)/paypalwebhook --data '{     "id": "WH-0K623039JK653552F-4YE01958GG893271P",    "create_time": "2024-12-09T23:37:49.867Z",    "resource_type": "sale",    "event_type": "PAYMENT.SALE.COMPLETED",    "summary": "Payment completed for EUR 15.0 EUR",    "resource": {      "billing_agreement_id": "I-XBCXVY6FXX47",      "amount": {        "total": "15.00",        "currency": "EUR",        "details": {          "subtotal": "15.00"        }      },      "payment_mode": "INSTANT_TRANSFER",      "update_time": "2024-12-09T23:37:46Z",      "create_time": "2024-12-09T23:37:46Z",      "protection_eligibility_type": "ITEM_NOT_RECEIVED_ELIGIBLE,UNAUTHORIZED_PAYMENT_ELIGIBLE",      "transaction_fee": {        "currency": "EUR",        "value": "0.64"      },      "protection_eligibility": "ELIGIBLE",      "links": [        {          "method": "GET",          "rel": "self",          "href": "https://api.sandbox.paypal.com/v1/payments/sale/3H059479R49575703"        },        {          "method": "POST",          "rel": "refund",          "href": "https://api.sandbox.paypal.com/v1/payments/sale/3H059479R49575703/refund"        }      ],      "id": "3H059479R49575703",      "state": "completed",      "invoice_number": ""    },    "status": "SUCCESS",    "transmissions": [      {        "webhook_url": "https://paypalwebhook-ypb2zslcea-uc.a.run.app",        "http_status": 200,        "reason_phrase": "HTTP/1.1 200 Connection established",        "response_headers": {          "X-Cloud-Trace-Context": "5df73ae1d22a76537a93d782bbcbd806;o=1",          "Server": "Google Frontend",          "Connection": "keep-alive",          "content-type": "text/html; charset=utf-8",          "Content-Length": "29",          "Date": "Mon, 09 Dec 2024 23:37:56 GMT"        },        "transmission_id": "9c3b9d60-b686-11ef-85fa-33b1e3dfa2fd",        "status": "SUCCESS",        "timestamp": "2024-12-09T23:37:53Z"      }    ],    "links": [      {        "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-0K623039JK653552F-4YE01958GG893271P",        "rel": "self",        "method": "GET",        "encType": "application/json"      },      {        "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-0K623039JK653552F-4YE01958GG893271P/resend",        "rel": "resend",        "method": "POST",        "encType": "application/json"      }    ],    "event_version": "1.0"  }' | yq

test-checksubscriberstatus-id:
	$(base-post) --location $(base-url)/checksubscriberstatus --data '{"data": {"client_id":"ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec","subscriptionId":"I-XBCXVY6FXX47"}}' | yq

test-checksubscriberstatus-email:
	$(base-post) --location $(base-url)/checksubscriberstatus --data '{"data": {"client_id":"ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec","email":"sb-xg3fp3830368@personal.example.com"}}' | yq

test-helloworld:
		$(base-post) --location $(base-url)/helloworld --data '{"data": {"client_id":"ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec"}}' | yq

functions-local:
	firebase emulators:start --only functions

deploy-functions:
	firebase deploy --only functions
