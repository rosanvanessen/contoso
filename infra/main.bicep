// OPTIONAL reference infrastructure — NOT deployed during the workshop.
// Azure Container Apps hosting the Contoso container image published to GHCR (lab A5, stretch).
// Deploy (only in your own sandbox subscription):
//   az deployment group create -g <rg> -f infra/main.bicep -p image=ghcr.io/<owner>/<repo>:<tag>
targetScope = 'resourceGroup'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image, e.g. ghcr.io/<owner>/<repo>:sha-<commit>')
param image string

@description('Short name used for resource names')
@maxLength(12)
param appName string = 'contoso'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${appName}-api'
  location: location
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: image
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
          probes: [
            { type: 'Liveness', httpGet: { path: '/api/health', port: 3000 } }
          ]
        }
      ]
      scale: { minReplicas: 0, maxReplicas: 2 }
    }
  }
}

output url string = 'https://${app.properties.configuration.ingress.fqdn}'
