# FE API Handoff

Base URL local:

```text
http://localhost:5137
```

Protected APIs require:

```text
Authorization: Bearer <accessToken>
```

## Auth

### Register

```http
POST /api/auth/register-profile
```

Body:

```json
{
  "email": "user@gmail.com",
  "fullName": "User Name",
  "password": "123456"
}
```

Response:

```json
{
  "message": "Ma OTP da duoc gui den Email."
}
```

### Verify OTP

```http
POST /api/auth/verify-otp
```

Body:

```json
{
  "email": "user@gmail.com",
  "otpCode": "123456"
}
```

### Login

```http
POST /api/auth/login-profile
```

Body:

```json
{
  "email": "user@gmail.com",
  "password": "123456"
}
```

Important response fields:

```json
{
  "userId": "guid",
  "email": "user@gmail.com",
  "fullName": "User Name",
  "role": "Customer",
  "accessToken": "jwt"
}
```

Store `accessToken` and send it with protected requests.

## Profile And Quota

```http
GET /api/profile/{userId}
```

Important response fields:

```json
{
  "planName": "Basic",
  "mangaMonthlyLimit": 30,
  "usedMangaCount": 1,
  "remainingMangaCount": 29,
  "videoMonthlyLimit": 10,
  "usedVideoCount": 0,
  "remainingVideoCount": 10,
  "monthlyGenerationLimit": 40,
  "usedGenerationCount": 1,
  "remainingGenerationCount": 39
}
```

Current packages:

```text
Free:    3 manga / 1 video per month
Basic:   30 manga / 10 video per month
Premium: 100 manga / 50 video per month
```

FE should prefer the manga/video fields. The total fields are kept for compatibility.

## Lesson Generation

### Create Draft

```http
POST /api/lessons/drafts
```

Body for manga:

```json
{
  "title": "Water Cycle",
  "rawContent": "Lesson content here...",
  "generateVideo": false,
  "creativeMode": 0,
  "creativeBrief": null
}
```

Body for video:

```json
{
  "title": "Water Cycle",
  "rawContent": "Lesson content here...",
  "generateVideo": true,
  "creativeMode": 0,
  "creativeBrief": "Make it visual and short."
}
```

`creativeMode`:

```text
0 = Auto
1 = Guided
```

If `creativeMode = 1`, `creativeBrief` is required.

Important response fields:

```json
{
  "id": "lesson-guid",
  "title": "Water Cycle",
  "outputMode": "Video",
  "scriptStatus": "AwaitingReview",
  "characterProfile": "...",
  "overallScript": "..."
}
```

At this step quota is not deducted yet.

### Approve And Generate Media

```http
POST /api/lessons/{lessonId}/approve
```

This starts the real media generation. Quota is deducted here:

```text
Manga lesson -> uses 1 manga quota
Video lesson -> uses 1 video quota
```

Important response shape:

```json
{
  "lesson": {
    "id": "lesson-guid",
    "outputMode": "Video",
    "scriptStatus": "Approved",
    "anchorImageUrl": "https://...",
    "chapters": [
      {
        "id": "chapter-guid",
        "order": 1,
        "summary": "...",
        "videoUrl": "https://...",
        "mangaUrl": null,
        "quiz": {
          "question": "...",
          "optionA": "...",
          "optionB": "...",
          "optionC": "...",
          "optionD": "...",
          "correctOption": "A",
          "explanation": "..."
        }
      }
    ]
  },
  "quota": {
    "planName": "Basic",
    "remainingMangaCount": 29,
    "remainingVideoCount": 9
  }
}
```

If manga mode, use `chapter.mangaUrl`.

If video mode, use `chapter.videoUrl`.

### Out Of Quota

Status:

```http
402 Payment Required
```

Response:

```json
{
  "message": "Ban da het luot generate video trong ky hien tai. Vui long nang cap goi hoac doi ky moi.",
  "quota": {
    "planName": "Free",
    "remainingMangaCount": 2,
    "remainingVideoCount": 0
  }
}
```

FE should show the message and redirect/suggest pricing.

### My Lessons

```http
GET /api/lessons/my
```

Returns lessons owned by the logged-in customer.

### Get Lesson By Id

```http
GET /api/lessons/{lessonId}
```

Customer can only view their own lessons. Staff/Admin can view all.

## Payment

### Create Invoice

```http
POST /api/payment/create-invoice
```

Body:

```json
{
  "amount": 10000,
  "planName": "Basic"
}
```

Important response fields:

```json
{
  "orderId": 1,
  "paymentCode": "MGX....",
  "planName": "Basic",
  "mangaMonthlyLimit": 30,
  "videoMonthlyLimit": 10,
  "monthlyGenerationLimit": 40,
  "status": "Pending"
}
```

### Check Payment Status

```http
GET /api/payment/check-status?code={paymentCode}
```

If paid:

```json
{
  "isPaid": true,
  "status": "Paid",
  "planName": "Basic",
  "mangaMonthlyLimit": 30,
  "videoMonthlyLimit": 10
}
```

## FE Notes

- Do not send `userId` from FE for lesson creation. Backend reads user from JWT.
- Draft creation is the review step. Approve is the expensive step.
- Show loading during approve because it calls AI, image/video provider, Cloudinary, and DB.
- Use quota fields by output type:
  - Manga page: `remainingMangaCount`
  - Video page: `remainingVideoCount`
- Use `402` response to display package upgrade message.
