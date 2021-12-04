# Gold trading

a financial trading server built with nodejs and typescript

<p align="center">


<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-brightgreen"/></a>

</p>

## Get started

### Instalation
In order to run the server, you'll need a recent version of nodejs
you also need a mysql database and redis database


### Configuration
create `.env` file in project root with items below:

```
DATABASE_URL=
REDIS_URL=
```

### Run the server

## Documentation

To get started visit wait for me to write some or dive in!

### Dependencies


## Tasks
- [ ] Signup prossess
  - [ ] Persian names only
  - [ ] Validate phone and [sheba number](https://www.refah-bank.ir/1557/index.aspx?tabindex=2#:~:text=What%20is%20Sheba%3F,exclusively%20in%20Iran's%20banking%20system.)
  - [x] First user become Owner
  - [ ] Inform admins about the new user and ask for confirmation
- [ ] User management
  - [x] Change User role
  - [ ] Access control based on role
  - [ ] Edit user info
  - [ ] Charge a user directly
  - [x] View users
  - [ ] View user transactions
  - [ ] View user trades and deals 
  - [x] Vip settings
    - [X] Show vip users 
    - [x] Base charge
    - [x] Bargains / vip off
- [ ] Admin features
  - [ ] Commition
  - [ ] Quotation
  - [ ] Automated quotation
  - [ ] Block
  - [ ] Last block report
  - [ ] Block history
  - [ ] Settle
  - [ ] Last settle report
  - [ ] Settle history
- [x] Setting service
- [ ] Trading options
  - [ ] Enable/Disable trading
  - [ ] Enable/Disable public trade reports


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.