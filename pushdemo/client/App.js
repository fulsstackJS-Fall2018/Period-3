import React, { Component } from 'react';
import { Platform, Text, View, StyleSheet,Alert } from 'react-native';
import { Constants, Location, Permissions,Notifications  } from 'expo';
const PUSH_ENDPOINT =  "http://41330e4d.ngrok.io";

export default class App extends Component {
  state = {
    location: null,
    errorMessage: null,
    notification : ""
  };

  componentDidMount() {
    this._getLocationAsync();
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      return;
    }

    // Get the token that uniquely identifies this device
    let pushToken = await Notifications.getExpoPushTokenAsync();

    let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
    
    const {latitude,longitude} = location.coords;

    fetch(PUSH_ENDPOINT+"/register", {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: Constants.deviceId, pushToken, latitude, longitude
      }),
    });
    this._notificationSubscription = Notifications.addListener(this._handleNotification);

    this.setState({ location });
  };

  _handleNotification = (notification) => {
    const msg = notification.data;
    const message = `User ${msg.id} just got online. Located at ${msg.latitude}, ${msg.longitude}`
    Alert.alert(message);
    this.setState({notification: message});
  };

render() {
  let text = 'Waiting..';
  if (this.state.errorMessage) {
    text = this.state.errorMessage;
  } else if (this.state.location) {
    text = JSON.stringify(this.state.location);
    if(this.state.notification){
      text = this.state.notification;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>{text}</Text>
    </View>
  );
}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
  },
});
