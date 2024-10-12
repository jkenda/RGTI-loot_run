const fs = require("fs")

function convert(obj) {
    const lines = obj.split("\n")
    const vertices = []
    const texcoords = []
    const normals = []
    const map = new Map()
    const model = {
        vertices: [],
        texcoords: [],
        normals: [],
        indices: []
    }

    for (const line of lines) {
        const words = line.split(/\s+/)
        const [type] = words

        if (type == "v") {
            const [, x, y, z] = words
            vertices.push([Number(x), Number(y), Number(z)])
        }
        else if (type == "vt") {
            const [, a, b] = words
            texcoords.push([Number(a), 1 - Number(b)])
        }
        else if (type == "vn") {
            const [, x, y, z] = words
            normals.push([Number(x), Number(y), Number(z)])
        }
        else if (type == "f") {
            const [va, ta, na] = words[1].split(/\//)
            const comba = words[1]

            let ia = map.size
            let element = map.get(comba)
            if (element === undefined) {
                map.set(comba, {
                    index: ia,
                    vertex: +va,
                    texcoord: +ta,
                    normal: +na,
                })
            }
            else {
                ia = element.index
            }

            for (let i = 2; i < words.length - 1; i++) {
                const [vb, tb, nb] = words[i].split(/\//)
                const [vc, tc, nc] = words[i + 1].split(/\//)

                const combb = words[i]
                const combc = words[i + 1]

                let ib = map.size

                element = map.get(combb)
                if (element === undefined) {
                    map.set(combb, {
                        index: ib,
                        vertex: +vb,
                        texcoord: +tb,
                        normal: +nb,
                    })
                }
                else {
                    ib = element.index
                }

                let ic = map.size

                element = map.get(combc)
                if (element === undefined) {
                    map.set(combc, {
                        index: ic,
                        vertex: +vc,
                        texcoord: +tc,
                        normal: +nc,
                    })
                }
                else {
                    ic = element.index
                }

                model.indices.push(ia, ib, ic)
            }
        }
    }

    for (const index of map.values()) {

        const vertex = index.vertex > 0
            ? vertices[index.vertex - 1]
            : index.vertex < 0
                ? vertices[vertices.length + index.vertex]
                : [0, 0, 0]

        const texcoord = index.texcoord > 0
            ? texcoords[index.texcoord - 1]
            : index.texcoord < 0
                ? texcoords[texcoords.length + index.texcoord]
                : [0, 0, 0]

        const normal = index.normal > 0
            ? normals[index.normal - 1]
            : index.normal < 0
                ? normals[normals.length + index.normal]
                : [0, 0, 0]

        model.vertices.push(...vertex)
        model.texcoords.push(...texcoord)
        model.normals.push(...normal)
    }

    return JSON.stringify(model)
}

const [in_filename, out_filename] = process.argv.slice(2, process.argv.length)

const obj = fs.readFileSync(in_filename).toString()

const json = convert(obj)
fs.writeFileSync(out_filename, json)
