const MAX_LIGHTS = 50;

const vertex = `#version 300 es
precision mediump float;
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;
layout (location = 3) in vec3 aTangent;
layout (location = 4) in vec3 aBitangent;

uniform mat4 uViewModel;
uniform mat4 uProjection;
uniform bool useNormalMap;

out vec3 vVertexPosition;
out vec3 vNormal;
out vec2 vTexCoord;
out mat3 TBN;

mat3 calcTBN()
{
    vec3 T = normalize((uViewModel * vec4(aTangent, 0)).xyz);
    vec3 B = normalize((uViewModel * vec4(aBitangent, 0)).xyz);
    vec3 N = normalize((uViewModel * vec4(aNormal, 0)).xyz);
    return mat3(T, B, N);
}

void main() 
{
    vVertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    gl_Position = uProjection * vec4(vVertexPosition, 1);
    vTexCoord = aTexCoord;

    if (useNormalMap)
        TBN = calcTBN();
    else
        vNormal = (uViewModel * vec4(aNormal, 0)).xyz;
}
`;

const fragment = `#version 300 es
precision mediump float;

struct DirLight {
    vec3 direction;
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight
{
    vec3 position;
    vec3 attenuation;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PlaneLight
{
    vec3 point;
    vec3 normal;
    vec3 attenuation;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

const float kPi = 3.14159265;

uniform mat4 uViewModel;

uniform mediump sampler2D uDiffuseMap;
uniform mediump sampler2D uSpecularMap;
uniform mediump sampler2D uNormalMap;

uniform bool hasDirLight;
uniform DirLight dirLight;
uniform PointLight[${MAX_LIGHTS}] pointLights;
uniform PlaneLight[${MAX_LIGHTS}] planeLights;
uniform int nPointLights, nPlaneLights;

uniform float uShininess;
uniform bool useNormalMap;

uniform float uFar;

in vec3 vVertexPosition;
in vec3 vNormal;
in vec2 vTexCoord;
in mat3 TBN;

out vec4 oColor;

vec4 calcDirLight(vec3 normal, vec3 viewDir)
{
    vec3 lightDir = normalize(-dirLight.direction);
    vec3 halfwayDir = normalize(lightDir + viewDir);  

    float kEnergyConservation = ( 8.0 + uShininess ) / ( 8.0 * kPi ); 
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = kEnergyConservation * pow(max(dot(normal, halfwayDir), 0.0), uShininess);

    vec3 ambient  = dirLight.ambient         * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 diffuse  = dirLight.diffuse  * diff * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 specular = dirLight.specular * spec * vec3(texture(uSpecularMap, vTexCoord));

    vec3 color = ambient + diffuse + specular;

    return vec4(color, 1);
}

vec4 calcPointLight(PointLight light, vec3 normal, vec3 viewDir)
{
    float d = distance(light.position, vVertexPosition);
    float attenuation = 1.0 / dot(light.attenuation, vec3(1, d, d * d)); 

    // light position is in camera coords
    vec3 lightDir = normalize(light.position - vVertexPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float kEnergyConservation = ( 8.0 + uShininess ) / ( 8.0 * kPi ); 
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = kEnergyConservation * pow(max(dot(normal, halfwayDir), 0.0), uShininess);

    // combine results
    vec3 ambient  = light.ambient         * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 specular = light.specular * spec * vec3(texture(uSpecularMap, vTexCoord));

    vec3 color = (ambient + diffuse + specular) * attenuation;

    return vec4(color, 1);
}

vec4 calcPlaneLight(PlaneLight light, vec3 normal, vec3 viewDir)
{
    float d = dot(vVertexPosition - light.point, light.normal);
    if (d < 0.0) return vec4(0, 0, 0, 1);

    float attenuation = 1.0 / dot(light.attenuation, vec3(1, d, d * d)); 

    vec3 reflectDir = reflect(-viewDir, normal);

    float kEnergyConservation = ( 8.0 + uShininess ) / ( 8.0 * kPi );
    float diff = max(dot(normal, -light.normal), 0.0);
    float spec = kEnergyConservation * max(-dot(reflectDir, light.normal), 0.0);

    // combine results
    vec3 ambient  = light.ambient         * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture(uDiffuseMap, vTexCoord));
    vec3 specular = light.specular * spec * vec3(texture(uSpecularMap, vTexCoord));

    vec3 color = (ambient + diffuse + specular) * attenuation;

    return vec4(color, 1);

}

vec3 mapNormal()
{
    vec3 normal = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
    return TBN * normal;
}

void main() 
{
    vec3 viewDir = normalize(-vVertexPosition);
    vec3 normal = useNormalMap ? mapNormal() : vNormal;
    float dist = length(vVertexPosition);

    oColor = hasDirLight ? calcDirLight(normal, viewDir) : vec4(0, 0, 0, 1);

    for (int i = 0; i < nPlaneLights; i++) {
        oColor += calcPlaneLight(planeLights[i], normal, viewDir);
    }

    for (int i = 0; i < nPointLights; i++) {
        oColor += calcPointLight(pointLights[i], normal, viewDir);
    }

    oColor.rgb *= max(-dist/uFar + 1.0, 0.0);
}
`;

export const shaders = {
  shader: { vertex, fragment },
};
