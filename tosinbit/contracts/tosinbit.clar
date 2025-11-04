;; tosinbit.clar - Simple fungible token demo for TosinBit
;; This is a minimal Clarity token implementation for local development with Clarinet.

(define-constant TOKEN-NAME "TosinBit")
(define-constant TOKEN-SYMBOL "TBIT")
(define-constant TOKEN-DECIMALS u6)

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))

(define-data-var total-supply uint u0)
(define-map balances { account: principal } { amount: uint })

;; Read-only getters
(define-read-only (get-name)
  TOKEN-NAME)

(define-read-only (get-symbol)
  TOKEN-SYMBOL)

(define-read-only (get-decimals)
  TOKEN-DECIMALS)

(define-read-only (get-total-supply)
  (var-get total-supply))

(define-read-only (get-balance (who principal))
  (let ((entry (default-to { amount: u0 } (map-get? balances { account: who }))))
    (get amount entry)))

;; Public functions
(define-public (mint (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let (
      (entry (default-to { amount: u0 } (map-get? balances { account: tx-sender })))
      (new-amt (+ (get amount entry) amount))
    )
      (map-set balances { account: tx-sender } { amount: new-amt })
      (var-set total-supply (+ (var-get total-supply) amount))
      (ok true))))

(define-public (burn (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let (
      (entry (default-to { amount: u0 } (map-get? balances { account: tx-sender })))
      (bal (get amount entry))
    )
      (asserts! (>= bal amount) ERR-INSUFFICIENT-BALANCE)
      (map-set balances { account: tx-sender } { amount: (- bal amount) })
      (var-set total-supply (- (var-get total-supply) amount))
      (ok true))))

(define-public (transfer (recipient principal) (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let (
      (sender tx-sender)
      (s-entry (default-to { amount: u0 } (map-get? balances { account: tx-sender })))
      (s-bal (get amount s-entry))
    )
      (asserts! (>= s-bal amount) ERR-INSUFFICIENT-BALANCE)
      (map-set balances { account: sender } { amount: (- s-bal amount) })
      (let ((r-entry (default-to { amount: u0 } (map-get? balances { account: recipient }))))
        (map-set balances { account: recipient } { amount: (+ (get amount r-entry) amount) }))
      (ok true))))
