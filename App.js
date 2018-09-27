import React from 'react';
import {
  StyleSheet, View, Text, FlatList, Image, TextInput, AsyncStorage, TouchableOpacity, Alert
} from 'react-native';
import { InstantSearch, connectInfiniteHits, connectSearchBox } from 'react-instantsearch-native';
import firebase from 'react-native-firebase';
import axios from 'axios';

const KEY = 'AAAAianHjnY:APA91bF448loUf5bV1o2BaJiDc3LpmXa-r4DrjZZVsr2ZMPJoK4fqMvx4X8_2aH7CZXnBswpoONVi_GM4WTCPno-4t4P-wdoW0VShZLMjuHF-70WMwyin8EaMyp9PEA2Xm4vUR5rR4gq';

const API_URL = "https://fcm.googleapis.com/fcm/send";

const deviceTokenIos = 'cQ1BsBG_bZs:APA91bGfxqUW36fKmFkQBhW9aaZebW5FA-1_GRkvC-_Nun-7WgCI2Ohgtah4wa9XsIAt7YQfDCXoAbVU8Bha29BrYDHN3cA-ubmG6lxCxW1dqSYCrplvbsm1slEKsQukxGjztad8aTZk';

const deviceAndroid = 'cljt-z6-s_A:APA91bFzyTowXuUi2bwI2PwkJcKrBKMV6NTGwfuxFUFsuOCbcZh28Bgksr7pF6n7BHyP184En5ScoUm7hfB6pwFLoYuCZgsC8F826t7NG1NS3LvddM07MxMdG7e5p1U7BangvAn5irtQ';
const SearchBox = connectSearchBox(({ refine, currentRefinement }) => {

  const styles = {
    height: 60,
    borderWidth: 1,
    padding: 10,
    margin: 10,
    marginTop: 50,
    flex: 1,
  };

  return (
    <TextInput
      style={styles}
      onChangeText={text => refine(text)}
      value={currentRefinement}
      placeholder={'Search a product...'}
      clearButtonMode={'always'}
      spellCheck={false}
      autoCorrect={false}
      autoCapitalize={'none'}
    />
  );
});

const Hits = connectInfiniteHits(({ hits, hasMore, refine }) => {

  /* if there are still results, you can
  call the refine function to load more */
  const onEndReached = function() {
    if (hasMore) {
      refine();
    }
  };

  return (
    <FlatList
      data={hits}
      onEndReached={onEndReached}
      keyExtractor={(item, index) => item.objectID}
      renderItem={({ item }) => {
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              style={{ height: 100, width: 100 }}
              source={{ uri: item.image }}
            />
            <View style={{ flex: 1 }}>
              <Text>
                {item.name}
              </Text>
              <Text>
                {item.type}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
});

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      token: "",
      tokenCopyFeedback: ""
    };
    ``
    this.sendNotification = this.sendNotification.bind(this);
    this.send = this.send.bind(this);
  }

  async componentDidMount() {
    this.checkPermission();
    this.createNotificationListeners(); //add this line
  }
  
  ////////////////////// Add these methods //////////////////////
    
    //Remove listeners allocated in createNotificationListeners()
  componentWillUnmount() {
    this.notificationListener();
    this.notificationOpenedListener();
  }
  
    //1
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }
  
    //3
  async getToken() {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    this.setState({ token: fcmToken });
    console.log(fcmToken);
    if (!fcmToken) {
        fcmToken = await firebase.messaging().getToken();
        console.log('fcmToken fcmToken fcmToken', fcmToken);
        if (fcmToken) {
          this.setState({ token: fcmToken });
            // user has a device token
            await AsyncStorage.setItem('fcmToken', fcmToken);
        }
    }
  }
  
    //2
  async requestPermission() {
    try {
        await firebase.messaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }

  async createNotificationListeners() {
    /*
    * Triggered when a particular notification has been received in foreground
    * */
    this.notificationListener = firebase.notifications().onNotification((notification) => {
        const { title, body } = notification;
        this.showAlert(title, body);
    });
  
    /*
    * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
    * */
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
        const { title, body } = notificationOpen.notification;
        this.showAlert(title, body);
    });
  
    /*
    * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
    * */
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
        const { title, body } = notificationOpen.notification;
        this.showAlert(title, body);
    }
    /*
    * Triggered for data only payload in foreground
    * */
    this.messageListener = firebase.messaging().onMessage((message) => {
      //process data message
      console.log(JSON.stringify(message));
    });


    this.unsubscribeFromNotificationListener = firebase.notifications().onNotification((notification) => {
      const { title, body } = notification;
      this.showAlert(title, body);
    })
}
  
  showAlert(title, body) {
    console.log(title, body);
    Alert.alert(
      title, body,
      [
          { text: 'OK ! Press me', onPress: () => console.log('OK Pressed') },
      ],
      { cancelable: false },
    );
  }

  send = async (body, type) => {
  	let headers = new Headers({
  		"Content-Type": "application/json",
      "Authorization": "key=" + KEY
    });
    
    const data = {
      "registration_ids" : [
        "cQ1BsBG_bZs:APA91bGfxqUW36fKmFkQBhW9aaZebW5FA-1_GRkvC-_Nun-7WgCI2Ohgtah4wa9XsIAt7YQfDCXoAbVU8Bha29BrYDHN3cA-ubmG6lxCxW1dqSYCrplvbsm1slEKsQukxGjztad8aTZk",
        "cljt-z6-s_A:APA91bFzyTowXuUi2bwI2PwkJcKrBKMV6NTGwfuxFUFsuOCbcZh28Bgksr7pF6n7BHyP184En5ScoUm7hfB6pwFLoYuCZgsC8F826t7NG1NS3LvddM07MxMdG7e5p1U7BangvAn5irtQ"
      ],
      "collapse_key" : "type_a",
      "notification" : {
          "body" : "First Notification",
          "title": "Test Push"
      },
      "data" : {
          "body" : "First Notification",
          "title": "Collapsing A",
          "key_1" : "Data for key one",
          "key_2" : "Hellowww"
      }
     }

    Alert.alert('this.state.token', this.state.token);

		try {
      let response = await axios(API_URL,
        { method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "key=AAAAianHjnY:APA91bF448loUf5bV1o2BaJiDc3LpmXa-r4DrjZZVsr2ZMPJoK4fqMvx4X8_2aH7CZXnBswpoONVi_GM4WTCPno-4t4P-wdoW0VShZLMjuHF-70WMwyin8EaMyp9PEA2Xm4vUR5rR4gq"
        }
      , body: data });
			Alert.alert('response', response);
			try{
				response = await response.json();
				if(!response.success){
					Alert.alert('Failed to send notification, check error log')
				}
			} catch (err){
				Alert.alert('Failed to send notification, check error log')
			}
		} catch (err) {
			Alert.alert('errrrrr', err && err.message);
		}
  }

  sendNotification = () => {
    const body = {
      notification: {
        title: 'Test Notif',
        body: 'Body Notif',
      },
      data: {
        id: 'dataId',
        data: 'ddddd',
      },
      registration_ids: [this.state.token],
    }
    axios(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${KEY}`,
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json()).then((json) => {
        Alert.alert('Respons', json);
      })
      .catch((e) => {
        Alert.alert('Error', e, e.message);
      });
  };
  
  render() {
    return (
      <View style={styles.container}>
        <InstantSearch
          appId="latency"
          apiKey="6be0576ff61c053d5f9a3225e2a90f76"
          indexName="instant_search"
        >
          <TouchableOpacity
            onPress={this.send}
          >
            <View>
              <Text>Send Notif</Text>
            </View>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <SearchBox />
          </View>
          <Hits />
        </InstantSearch>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
});
