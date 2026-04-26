import { TriggerHandler } from './base/trigger-handler';
/*
class LocationTrackingTriggerHandler extends TriggerHandler<LocationTracking, LocationTrackingService> {

    private emergencyStateService = ServiceManager.get(EmergencyStateService);
    private googleMapsService = ServiceManager.get(GoogleMapsService);

    constructor() {
        super(LocationTracking, LocationTrackingService);
    }

    protected afterCreate(locationTracking: LocationTracking) {
        this.emergencyStateService.getById(locationTracking.emergencyStateRelation.id, ['emergencyRelation']).then(emergencyState => {
            locationTracking.emergencyRelation = emergencyState.emergencyRelation;
            locationTracking.userRelation = emergencyState.userRelation;
            locationTracking.save().then((ret) => {
                console.log('success: ' + ret);
            }, error => {
                console.warn('LocationTracking error: ' + error);
            });

            // save distance and duration
            this.googleMapsService.getClient().distanceMatrix(
                {
                    origins: [locationTracking.location.latitude + ', ' + locationTracking.location.longitude],
                    destinations: [emergencyState.emergencyRelation.locationPoint.latitude + ', ' + emergencyState.emergencyRelation.locationPoint.longitude],
                    mode: 'walking'
                }, (error, response) => {
                    if (error == null) {
                        const results = response.json.rows[0].elements;
                        const element = results[0];

                        locationTracking.duration = element.duration.value / 60;
                        locationTracking.distance = element.distance.value;
                        locationTracking.save();

                        if (locationTracking.distance <= 10) {
                            emergencyState.state = EmergencyStateEnum.arrived;
                            emergencyState.save();
                        }
                    } else {
                        console.warn('LocationTracking error while getting distance from MAPS API');
                        console.warn(error);
                    }
                });
        });
    }
}

TriggerHandler.register(LocationTrackingTriggerHandler);

*/