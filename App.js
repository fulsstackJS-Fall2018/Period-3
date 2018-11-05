import React, { Component } from 'react';
import { Platform, Text, View, StyleSheet, TouchableHighlight, Alert } from 'react-native';
import { Constants, Location, MapView, Permissions } from 'expo';
const SERVER_URL = "REPLACE ME WITH REAL URL";


class MyButton extends Component {

  render() {
    return (
      <TouchableHighlight style={{ backgroundColor: "#4682B4", margin: 3 }} onPress={this.props.onPressButton}>
        <Text style={{ fontSize: 22, textAlign: "center", padding: 5 }}>{this.props.txt}</Text>
      </TouchableHighlight>
    );
  }
}

export default class App extends Component {
  constructor() {
    super();
    console.ignoredYellowBox = ['Warning: View.propTypes'];
    this.state = {
      latitude: null,
      longitude: null,
      errorMessage: null,
      allowedArea: [],
      region: null,
      serverIsUp: false,
      statusBarHeight: Constants.statusBarHeight - 1
    };
  }

  async componentDidMount() {
    try {
      const res = await fetch(`${SERVER_URL}/geoapi/allowedarea`).then(res => res.json());
      this.setState({ allowedArea: res.coordinates, serverIsUp: true });
    } catch (err) {
      this.setState({ serverIsUp: false });
    }

    //Hack to ensure the showsMyLocationButton is shown initially. Idea is to force a repaint
    setTimeout(() => this.setState({ statusBarHeight: Constants.statusBarHeight }), 500);
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    let location = await Location.getCurrentPositionAsync({});
    this.setState(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        region: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      });
  };

  onPress = (event) => {
    const coordinate = event.nativeEvent.coordinate;
    const pos = { coordinates: [coordinate.longitude, coordinate.latitude] };

    console.log("Location for press: " + JSON.stringify(pos));
    fetch(`${SERVER_URL}/geoapi`, {
      method: "post",
      body: JSON.stringify(pos),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
      .then(res => res.json())
      .then(res => {
        this.setState({ status: res.msg });
        setTimeout(() => this.setState({ status: "- - - - - - - - - - - - - - - - - - - -" }), 2000);
      }).catch(err => {
        Alert.alert("Error", "Server could not be reached")
        this.setState({ serverIsUp: false });
      })
  }

  onCenterGameArea = () => {
    //Hardcoded, should be calculated as center of polygon received from server
    const latitude = 55.777055745928664;
    const longitude = 12.55897432565689;
    this.refs.map.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.002,
      longitudeDelta: 0.04,
    }, 1000);
  }

  onPressButton = async (realData) => {
    let pos;
    if (realData) {
      pos = { coordinates: [this.state.latitude, this.state.longitude] };
    }
    try {
      const res = await fetch(`${SERVER_URL}/geoapi`, {
        method: "post", body: JSON.stringify(pos), headers: new Headers({ 'Content-Type': 'application/json' })
      }).then(res => res.json());
      this.setState({ status: res.msg });
      setTimeout(() => this.setState({ status: "- - - - - - - - - - - - - - - - - - - -" }), 3000);
    } catch (err) {
      Alert.alert("Error", "Server could not be reached")
      this.setState({ serverIsUp: false });
    }
  }

  render() {
    if (!this.state.region) {
      return <View style={{
        flex: 1, flexDirection: "row", justifyContent: 'center',
        alignItems: "center", paddingTop: this.state.statusBarHeight
      }}>
        <Text style={{ fontSize: 35 }}>... Fetching data</Text></View>
    }
    const info = this.state.serverIsUp ? this.state.status : " Server is not up";

    return (
      <View style={{ flex: 1, paddingTop: this.state.statusBarHeight }}>
        <MapView
          ref="map"
          style={{ flex: 14 }}
          onPress={this.onPress}
          mapType="standard"
          showsScale={true}
          //showsUserLocation={true}
          showsMyLocationButton={true}
          region={this.state.region}
        >
          {this.state.serverIsUp &&
            <MapView.Polygon coordinates={this.state.allowedArea}
              strokeWidth={1}
              onPress={this.onPress}
              fillColor="rgba(128, 153, 177, 0.5)" />
          }
          <MapView.Marker
            coordinate={{ longitude: this.state.longitude, latitude: this.state.latitude }}
          />
        </MapView>

        <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
          Your position (lat,long): {this.state.latitude}, {this.state.longitude}
        </Text>
        <Text style={{ flex: 1, textAlign: "center" }}>{info}</Text>
        
        <MyButton style={{ flex: 2 }} onPressButton={this.onPressButton.bind(this, true)}
          txt="Upload real Position" />
        
        <MyButton style={{ flex: 2 }} onPressButton={this.onCenterGameArea}
          txt="Show Game Area" />
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
