const db = require('./index.js');
const axios = require('axios');
const Hotels = require('./schema.js');
const helpers = require('./seedHelpers.js');

const users = [];
const photos = [];

const seedData = () => {
  Hotels.deleteMany({}, () => console.log('Hotels cleared'))
    .then(() => {
      console.log('\n\n\n');

      // make 4 rounds of GET reqs to unsplash for a total of 120 photos
      for (let num = 1, p = Promise.resolve(); num < 5; num++) {
        p = p.then( () => new Promise( resolve => (
          getPhotosFromUnsplash(num)
            .then( res => storeUsers(res.data.results, storePhotos) )
            // .then( data => storePhotos(data) )
            .then(resolve)
            .catch(err => console.log('getPhotosFromUnsplash ERROR:', err))
        ) ) );
      }
    })
    .catch(err => console.log('seedData ERROR:', err));
};

seedData();

const getPhotosFromUnsplash = pageNum => {
  const unsplashKey = `NBH3f9wudZBLZabSuudUjeQsQP2HAedTgXy9Ogk8MEU`;

  return axios({
    method: 'get',
    url: `https://api.unsplash.com/search/photos/?client_id=${ unsplashKey }`,
    params: {
      query: 'hotel',
      per_page: 30,
      page: pageNum
    }
  });
};

const storeUsers = (photoData, storePhotos) => {
  for (let photo of photoData) {
    const userData = photo.user;
    const randomUserInfo = helpers.generateUserInfo();

    const newUser = {
      id: userData.id,
      username: userData.username,
      avatarURL: userData.profile_image.medium,
      location: randomUserInfo.location,
      type: randomUserInfo.type,
      rating: randomUserInfo.rating,
      contributions: randomUserInfo.contributions,
      review: randomUserInfo.review // will often be the photo caption, unless user type is Management?
    };
    users.push(newUser);
  }
  storePhotos(photoData);
};

const storePhotos = photoData => {
  for (let photo of photoData) {
    const randomPhotoInfo = helpers.generatePhotoInfo(users);

    const newPhoto = {
      id: photo.id,
      URL: photo.urls.raw,
      date: photo.created_at,
      user: randomPhotoInfo.user,
      caption: randomPhotoInfo.user.review,
      albums: randomPhotoInfo.albums,
      filters: randomPhotoInfo.filters,
      trips: randomPhotoInfo.trips, // this is the Heart/Favorite feature
      helpful: randomPhotoInfo.helpful
    };
    photos.push(newPhoto);
  }
  photos.length === 120 && seedHotels(); // only seed hotels when photos arr is full
};

const printHotels = () => {
  Hotels.find({}).limit(1)
    .then(hotels => {
      console.log(hotels[0].photos);
      return hotels;
    })
    .then(hotels => console.log(`# of Hotels stored:`, hotels.length))
    .catch(err => console.log('printHotels ERROR:', err));
};

function seedHotels() {
  for (let i = 0; i < 100; i++) {
    const randomHotelInfo = helpers.generateHotelInfo(photos);

    const newHotel = new Hotels({
      id: i + 1,
      name: randomHotelInfo.names[i],
      photos: randomHotelInfo.photos,
      photoAlbums: randomHotelInfo.albums,
      price: randomHotelInfo.price // the price next to the View Deal button on upper right of full view modal
    });
    newHotel.save( err => err ? console.log('err seeding hotels:', err) : printHotels() );
  }
};

module.exports = seedData;
