# Gold trading

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

a financial trading server built with nodejs and typescript

## Get started

### Instalation

download the source code from github, install required dependencies, configure the project and run the server

#### Requirments

* Nodejs `v16.13.0`
* Mysql `v8.0.27`
* Redis
* Pusher service

#### Configuration
create `.env` file in project root with items below:

```
DATABASE_URL=
REDIS_URL=
MINIO_URL=
MINIO_PORT=
MINIO_USER=
MINIO_PASS=
PUSHER_INSTANCE_ID=
PUSHER_KEY=
JWT_SECRET=
```

#### Run the server

```
npm run build
npm start
```

## Documentation

To get started visit wait for me to write some or dive in!

### API endpoints

#### Auth endpoints
* `/auth/login`
* `/auth/authenticate`
* `/auth/register`
* `/auth/token`
* `/auth/beams`

#### User personal endpoints
* `/me`
* `/me/notifications`
* `/me/transactions`
* `/me/transactions/requestDischarge`
* `/me/transactions/requestCharge`
* `/me/bills`
* `/me/deals`
* `/me/commitions`
* `/me/blocks`
* `/me/settles`
* `/me/avatar`
* `/me/avatar/set`
* `/me/document`
* `/me/document/add`

#### Users management endpoints

* `/users/`
* `/users/user`
* `/users/avatar`
* `/users/document`
* `/users/transactions`
* `/users/transactions/decline`
* `/users/transactions/confirm`
* `/users/transactions/done`
* `/users/transactions/charge`
* `/users/transactions/update_vip`
* `/users/updateRole`
* `/users/verify`


#### Settings endpoints
* `/setting/`
* `/setting/BASE_CHARGE`
* `/setting/COMMITION`
* `/setting/DISCHARGE_ACTIVATED`
* `/setting/OFFER_AGE`
* `/setting/OFFER_EXPIRE`
* `/setting/QUOTATION`
* `/setting/TARADING_ACTIVATED`
* `/setting/TOLERENCE`
* `/setting/VIP_OFF`

#### Trade endpoints
* `/trade/offers`
* `/trade/bills`
* `/trade/deals`
* `/trade/commitions`
* `/trade/settles`
* `/trade/settleresults`
* `/trade/blocks`
* `/trade/blockresults`
* `/trade/settle`
* `/trade/block`
* `/trade/prices`
* `/trade/cancel`
* `/trade/offer`
* `/trade/trade`

#### Socket.io events

* `/newUser`
* `/chargeRequest`
* `/newPrice`
* `/setting`
* `/offer`
* `/auctionHit/${userId}`
* `/auctionMargin/${userId}`
* `/auction/${userId}`
* `/newCharge/${userId}`
* `/charge/${userId}`
* `/settle/${userId}`
* `/block/${userId}`
* `/notification/${userId}`