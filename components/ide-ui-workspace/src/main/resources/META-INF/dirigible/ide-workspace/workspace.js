/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
/**
 * Used to enable and disable the paste context menu option.
 */
let pasteObject = {
    canPaste: false,
    type: "#"
};
let uploader = null;
/**
 * Utility URL builder
 */
let UriBuilder = function UriBuilder() {
    this.pathSegments = [];
    return this;
};
UriBuilder.prototype.path = function (_pathSegments) {
    if (!Array.isArray(_pathSegments))
        _pathSegments = [_pathSegments];
    _pathSegments = _pathSegments.filter(function (segment) {
        return segment;
    })
        .map(function (segment) {
            if (segment.length) {
                if (segment.charAt(segment.length - 1) === '/')
                    segment = segment.substring(0, segment.length - 2);
                segment = encodeURIComponent(segment);
            }
            return segment;
        });
    this.pathSegments = this.pathSegments.concat(_pathSegments);
    return this;
};
UriBuilder.prototype.build = function (isBasePath = true) {
    if (isBasePath) return '/' + this.pathSegments.join('/');
    return this.pathSegments.join('/');
}

/**
 * Workspace Service API delegate
 */
let WorkspaceService = function ($http, $window, workspaceManagerServiceUrl, workspacesServiceUrl, treeCfg) {

    this.$http = $http;
    this.$window = $window;
    this.workspaceManagerServiceUrl = workspaceManagerServiceUrl;
    this.workspacesServiceUrl = workspacesServiceUrl;
    this.typeMapping = treeCfg['types'];

    this.newFileName = function (name, type, siblingFilenames) {
        type = type || 'default';
        //check for custom new file name template in the global configuration
        if (type && this.typeMapping[type] && this.typeMapping[type].template_new_name) {
            let nameIncrementRegex = this.typeMapping[type].name_increment_regex;
            siblingFilenames = siblingFilenames || [];
            let suffix = nextIncrementSegment(siblingFilenames, name, nameIncrementRegex);
            suffix = suffix < 0 ? " " : suffix;
            let parameters = {
                "{name}": name || 'file',
                "{ext}": this.typeMapping[type].ext,
                "{increment}": "-" + suffix
            };
            let tmpl = this.typeMapping[type].template_new_name;
            let regex = new RegExp(Object.keys(parameters).join('|'), 'g');
            let fName = tmpl.replace(regex, function (m) {
                return parameters[m] !== undefined ? parameters[m] : m;
            });
            name = fName.trim();
        }
        return name;
    };

    let startsWith = function (stringToTest, prefixToTest) {
        let startsWithRegEx = new RegExp('^' + prefixToTest);
        let matches = stringToTest.match(startsWithRegEx);
        return matches != null && matches.length > 0;
    };

    let strictInt = function (value) {
        if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
            return Number(value);
        return NaN;
    };

    let toInt = function (value) {
        if (value === undefined)
            return;
        let _result = value.trim();
        _result = strictInt(_result);
        if (isNaN(_result))
            _result = undefined;
        return _result;
    };

    //processes an array of sibling string filenames to calculate the next incrmeent suffix segment
    let nextIncrementSegment = function (filenames, filenameToMatch, nameIncrementRegex) {
        let maxIncrement = filenames.map(function (siblingFilename) {
            //find out incremented file name matches (such as {file-name} {i}.{extension} or {file-name}-{i}.{extension})
            let incr = -2;
            //in case we have a regex configured to find out the increment direclty, use it
            if (nameIncrementRegex) {
                let regex = new Regex(nameIncrementRegex);
                let result = siblingFilename.match(regex);
                if (result !== null) {
                    incr = toInt(result[0]);
                }
            } else {
                //try heuristics
                let regex = /(.*?)(\.[^.]*$|$)/;
                let siblingTextSegments = siblingFilename.match(regex);//matches filename and extension segments of a filename
                let siblingTextFileName = siblingTextSegments[1];
                let siblingTextExtension = siblingTextSegments[2];
                let nodeTextSegments = filenameToMatch.match(regex);
                let nodeTextFileName = nodeTextSegments[1];
                let nodeTextExtension = nodeTextSegments[2];
                if (siblingTextExtension === nodeTextExtension) {
                    if (siblingTextFileName === nodeTextFileName)
                        return -1;
                    if (startsWith(siblingTextFileName, nodeTextFileName)) {
                        //try to figure out the increment segment from the name part. Starting backwards, exepcts that the increment is the last numeric segment in the name
                        let _inc = "";
                        for (let i = siblingTextFileName.length - 1; i > -1; i--) {
                            let code = siblingTextFileName.charCodeAt(i);
                            if (code < 48 || code > 57)//decimal numbers only
                                break;
                            _inc = siblingTextFileName[i] + _inc;
                        }
                        if (_inc) {
                            incr = toInt(_inc);
                        }
                    }
                }
            }
            return incr;
        }).sort(function (a, b) {
            return a - b;
        }).pop();
        return ++maxIncrement;
    };
};

WorkspaceService.prototype.createFolder = function (type) {
    let inst = $.jstree.reference(data.reference),
        obj = inst.get_node(data.reference);
    let node_tmpl = {
        type: 'folder',
        text: this.newFileName('folder', 'folder')
    };
    inst.create_node(obj, node_tmpl, "last", function (new_node) {
        inst.edit(new_node);
    });
};

WorkspaceService.prototype.createFile = function (name, path, node) {
    let isDirectory = node.type === 'folder';
    let url = new UriBuilder().path((this.workspacesServiceUrl + path).split('/')).path(name).build();
    if (isDirectory)
        url += "/";
    if (!node.data)
        node.data = '';
    return this.$http.post(url, JSON.stringify(node.data), { headers: { 'Dirigible-Editor': 'Workspace' } })
        .then(function (response) {
            let filePath = response.headers('location');
            filePath = filePath.substring(filePath.indexOf("/services"))
            return this.$http.get(filePath, { headers: { 'describe': 'application/json' } })
                .then(function (response) { return response.data; });
        }.bind(this))
        .catch(function (response) {
            let msg;
            if (response.data && response.data.error)
                msg = response.data.error;
            else
                msg = response.data || response.statusText || 'Unspecified server error. HTTP Code [' + response.status + ']';
            throw msg;
        });
};
WorkspaceService.prototype.uploadFile = function (name, path, node) {
    let isDirectory = node.type === 'folder';
    let url = new UriBuilder().path((this.workspacesServiceUrl + path).split('/')).path(name).build();
    if (isDirectory)
        url += "/";
    if (!node.data)
        node.data = '';
    let req = {
        method: 'POST',
        url: url,
        headers: {
            'Dirigible-Editor': 'Editor',
            'Content-Type': 'application/octet-stream',
            'Content-Transfer-Encoding': 'base64'
        },
        data: JSON.stringify(btoa(node.data))
    };
    return this.$http(req)
        .then(function (response) {
            let filePath = response.headers('location');
            filePath = filePath.substring(filePath.indexOf("/services"));
            return this.$http.get(filePath, { headers: { 'describe': 'application/json' } })
                .then(function (response) { return response.data; });
        }.bind(this))
        .catch(function (response) {
            let msg;
            if (response.data && response.data.error)
                msg = response.data.error;
            else
                msg = response.data || response.statusText || 'Unspecified server error. HTTP Code [' + response.status + ']';
            throw msg;
        });
};
WorkspaceService.prototype.remove = function (filepath) {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).path(filepath.split('/')).build();
    return this.$http['delete'](url, { headers: { 'Dirigible-Editor': 'Workspace' } });
};
WorkspaceService.prototype.rename = function (oldName, newName, path) {
    let pathSegments = path.split('/');
    if (pathSegments.length > 2) {
        let workspaceName = path.split('/')[1];
        let url = new UriBuilder().path(this.workspaceManagerServiceUrl.split('/')).path(workspaceName).path('rename').build();
        let parent = pathSegments.slice(2, -1);
        let sourcepath = new UriBuilder().path(parent).path(oldName).build();
        let targetpath = new UriBuilder().path(parent).path(newName).build();
        return this.$http.post(url, {
            source: sourcepath,
            target: targetpath
        })
            .then(function (response) {
                return response.data;
            });
    }
};
WorkspaceService.prototype.move = function (filename, sourcepath, targetpath, workspaceName) {
    let url = new UriBuilder().path(this.workspaceManagerServiceUrl.split('/')).path(workspaceName).path('move').build();
    //NOTE: The third argument is a temporary fix for the REST API issue that sending header  content-type: 'application/json' fails the move operation
    return this.$http.post(url, {
        source: sourcepath + '/' + filename,
        target: targetpath + '/' + filename,
    });
};
WorkspaceService.prototype.copy = function (sourcePath, targetPath, sourceWorkspace, targetWorkspace) {
    let url = new UriBuilder().path(this.workspaceManagerServiceUrl.split('/')).path(targetWorkspace).path('copy').build();
    return this.$http.post(url, {
        sourceWorkspace: sourceWorkspace,
        source: sourcePath,
        targetWorkspace: targetWorkspace,
        target: targetPath + '/'
    });
};
WorkspaceService.prototype.copySelection = function (sourceSelection, targetPath, conflictsResolution, wsTree) {
    let targetWorkspace = targetPath.split('/')[1];
    let url = new UriBuilder().path(this.workspaceManagerServiceUrl.split('/')).path(targetWorkspace).path('copySelection').build();
    let sourceWorkspace = sourceSelection[0].path.split('/')[1];
    for (let i = 0; i < conflictsResolution.length; i++) {
        sourceSelection.find((o, j) => {
            if (o.path === conflictsResolution[i].source) {
                sourceSelection[j].resolution = conflictsResolution[i].resolution;
                return true;
            }
        })
    }

    let postRequest = {
        sourceWorkspace: sourceWorkspace,
        sourceSelection: sourceSelection,
        targetWorkspace: targetWorkspace,
        target: targetPath + '/'
    };

    return this.$http.post(url, postRequest)
        .then(function (response) {
            $('#refreshButton').click();
            return response.data;
        });
};
WorkspaceService.prototype.load = function (wsResourcePath) {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).path(wsResourcePath.split('/')).build();
    return this.$http.get(url, { headers: { 'describe': 'application/json' } })
        .then(function (response) {
            return response.data;
        });
};
WorkspaceService.prototype.listWorkspaceNames = function () {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).build();
    return this.$http.get(url)
        .then(function (response) {
            return response.data;
        });
};
WorkspaceService.prototype.createWorkspace = function (workspace) {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).path(workspace).build();
    return this.$http.post(url, {})
        .then(function (response) {
            return response.data;
        });
};
WorkspaceService.prototype.createProject = function (workspace, project, wsTree) {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).path(workspace).path(project).build();
    return this.$http.post(url, {})
        .then(function (response) {
            wsTree.refresh();
            return response.data;
        });
};
WorkspaceService.prototype.deleteProject = function (workspace, project, wsTree) {
    let url = new UriBuilder().path(this.workspacesServiceUrl.split('/')).path(workspace).path(project.name).build();
    return this.$http.delete(url, { headers: { 'Dirigible-Editor': 'Workspace' } })
        .then(function (response) {
            project.files.forEach(function (f) {
                wsTree.messageHub.announceFileDeleted(f);
            });

            wsTree.refresh();
            return response.data;
        });
};
WorkspaceService.prototype.linkProject = function (workspace, project, path, wsTree) {
    let url = new UriBuilder().path(this.workspaceManagerServiceUrl.split('/')).path(workspace).path('linkProject').build();
    return this.$http.post(url, {
        source: project,
        target: path
    })
        .then(function (response) {
            wsTree.refresh();
            return response.data;
        });
};

/**
 * Workspace Tree Adapter mediating the workspace service REST api and the jst tree componet working with it
 */
let WorkspaceTreeAdapter = function (treeConfig, workspaceService, publishService, exportService, messageHub) {
    this.treeConfig = treeConfig;
    this.workspaceService = workspaceService;
    this.publishService = publishService;
    this.exportService = exportService;
    this.messageHub = messageHub;

    this._buildTreeNode = function (f) {
        let children = [];
        if (f.type == 'folder' || f.type == 'project') {
            children = f.folders.map(this._buildTreeNode.bind(this));
            let _files = f.files.map(this._buildTreeNode.bind(this));
            children = children.concat(_files);
        }
        let icon = getIcon(f);

        f.label = f.name;
        return {
            "text": f.name,
            "children": children,
            "type": f.type,
            "git": f.git,
            "gitName": f.gitName,
            "icon": icon,
            "_file": f
        };
    };

    this._fnr = function (node, replacement) {
        if (node.children) {
            let done;
            node.children = node.children.map(function (c) {
                if (!done && c._file.path === replacement._file.path) {
                    done = true;
                    return replacement;
                }
                return c;
            });
            if (done)
                return true;
            node.children.forEach(function (c) {
                return this._fnr(c, replacement);
            }.bind(this));
        }
        return;
    };
};

WorkspaceTreeAdapter.prototype.init = function (containerEl, workspaceController, scope) {
    this.containerEl = containerEl;
    this.workspaceController = workspaceController;
    this.workspaceName = workspaceController.selectedWorkspace;
    this.scope = scope;
    this.copy_node = null;
    this.nodes_selected = [];
    this.paths_selected = [];

    let self = this;
    let jstree = this.containerEl.jstree(this.treeConfig);

    //subscribe event listeners
    jstree.on('contextmenu', function (evt) {
        if (evt.target === evt.delegateTarget) {
            let inst = $.jstree.reference(evt.target);
            if (inst) {
                evt.preventDefault();
                let disabled = true;
                if (this.copy_node !== null) {
                    // We can paste only projects here.
                    // Other types are handled by the context menu in '$treeConfig' factory
                    disabled = this.copy_node.type !== "project";
                }
                $.vakata.context.show(evt.target, { 'x': evt.pageX, 'y': evt.pageY }, {
                    "paste": {
                        "_disabled": disabled,
                        "label": "Paste",
                        "action": function (data) {
                            let tree = $.jstree.reference(data.reference);
                            let node = tree.get_node(data.reference);
                            tree.element.trigger('jstree.workspace.paste', [node]);
                        }
                    }
                });
                return false;
            }
        }
    }.bind(this))
        .on('select_node.jstree', function (e, data) {
            this.workspaceController.selectedNodes = data.selected;
            if (data.node.type === 'file') {
                this.clickNode(this.jstree.get_node(data.node));
            }
            this.workspaceController.selectedNodeData = this.getSelectedNodes(this.workspaceController.selectedNodes,
                this.workspaceController.wsTree.jstree._model.data);
        }.bind(this))
        .on('dblclick.jstree', function (evt) {
            this.dblClickNode(this.jstree.get_node(evt.target));
        }.bind(this))
        .on('open_node.jstree', function (evt, data) {
            if (data.node.type !== 'project') {
                data.instance.set_icon(data.node, 'fa fa-folder-open-o');
            }
        })
        .on('close_node.jstree', function (evt, data) {
            if (data.node.type !== 'project') {
                data.instance.set_icon(data.node, 'fa fa-folder-o');
            }
        })
        .on('create_node.jstree', function (e, data) {
            data.node.name = data.node.text;
            data.node.icon = getIcon(data.node);
        })
        .on('rename_node.jstree', function (e, data) {
            if (data.old !== data.text || !data.node.original._file) {
                this.renameNode(data.node, data.old, data.text);
            }
        }.bind(this))
        .on('move_node.jstree', function (e, data) {
            let node = data.node;
            let oldParentNode = data.instance.get_node(data.old_parent);
            this.moveNode(oldParentNode, node);
        }.bind(this))
        .on('copy_node.jstree', function (e, data) {
            let node = data.node;
            let oldParentNode = data.instance.get_node(data.old_parent);
            this.copyNode(oldParentNode, node);
        }.bind(this))
        .on('jstree.workspace.publish', function (e, data) {
            this.publish(data);
        }.bind(this))
        .on('jstree.workspace.unpublish', function (e, data) {
            this.unpublish(data);
        }.bind(this))
        .on('jstree.workspace.export', function (e, data) {
            this.exportProject(data);
        }.bind(this))
        .on('jstree.workspace.generate', function (e, data) {
            this.generateFile(data, scope);
        }.bind(this))
        .on('jstree.workspace.upload', function (e, data) {
            this.uploadFileInPlace(data, scope);
        }.bind(this))
        .on('jstree.workspace.openWith', function (e, data, editor) {
            this.openWith(data, editor);
        }.bind(this))
        .on('jstree.workspace.copy', function (e, data) {
            this.copy(data);
        }.bind(this))
        .on('jstree.workspace.paste', function (e, data) {
            this.paste(data);
        }.bind(this))
        .on('jstree.workspace.uploadZipToFolder', function (e, data) {
            this.uploadZipToFolder(data, scope);
        }.bind(this))
        .on('jstree.workspace.delete', function (e, data) {
            this.workspaceController.showDeleteDialog(this.workspaceController.selectedNodeData.length == 1
                ? this.workspaceController.selectedNodeData[0].type :
                this.workspaceController.selectedNodeData.length + ' file nodes');
        }.bind(this))
        ;

    this.jstree = $.jstree.reference(jstree);
    return this;
};
WorkspaceTreeAdapter.prototype.getSelectedNodes = function (selectedNodeIDs, nodesList) {
    let selected = [];
    for (let i = 0; i < selectedNodeIDs.length; i++)
        if (nodesList[selectedNodeIDs[i]])
            selected.push({ id: selectedNodeIDs[i], ...nodesList[selectedNodeIDs[i]].original._file });
    return selected;
};
WorkspaceTreeAdapter.prototype.createNode = function (parentNode, type, defaultName) {
    if (type === undefined)
        type = 'file';
    let siblingIds = parentNode.children || [];
    let filenames = siblingIds.map(function (id) {
        if (this.jstree.get_node(id).original.type !== type)
            return;
        return this.jstree.get_node(id).text;
    }.bind(this))
        .filter(function (siblingFName) {
            return siblingFName !== undefined;
        });

    if (!defaultName) {
        defaultName = type === 'folder' ? 'folder' : 'file';
    }

    let node_tmpl = {
        type: type,
        text: this.workspaceService.newFileName(defaultName, type, filenames)
    };

    let self = this;
    this.jstree.create_node(parentNode, node_tmpl, "last",
        function (new_node) {
            self.jstree.edit(new_node);
        });
};
WorkspaceTreeAdapter.prototype.deleteNode = function (data) {
    let path = data.path;
    let self = this;
    return this.workspaceService.remove.apply(this.workspaceService, [path])
        .then(function () {
            self.messageHub.announceFileDeleted(data);
        })
        .finally(function () {
            self.refresh();
        });
};
WorkspaceTreeAdapter.prototype.renameNode = function (node, oldName, newName) {
    if (!node.original._file) {
        let parentNode = this.jstree.get_node(node.parent);
        let fpath = parentNode.original._file.path;
        this.workspaceService.createFile.apply(this.workspaceService, [newName, fpath, node])
            .then(function (f) {
                node.original._file = f;
                node.original._file.label = node.original._file.name;
                this.messageHub.announceFileCreated(f);
            }.bind(this))
            .catch(function (node, err) {
                this.refresh();
                throw err;
            }.bind(this, node))
            .finally(function () {
                this.refresh();
            }.bind(this));
    } else {
        this.workspaceService.rename.apply(this.workspaceService, [oldName, newName, node.original._file.path])
            .then(function (data) {
                this.messageHub.announceFileRenamed(node.original._file, oldName, newName);
            }.bind(this))
            .finally(function () {
                this.refresh();
            }.bind(this));
    }
};
WorkspaceTreeAdapter.prototype.moveNode = function (sourceParentNode, node) {
    //strip the "/{workspace}" segment from paths and the file segment from source path (for consistency)
    let sourcepath = sourceParentNode.original._file.path.substring(this.workspaceName.length + 1);
    let tagetParentNode = this.jstree.get_node(node.parent);
    let targetpath = tagetParentNode.original._file.path.substring(this.workspaceName.length + 1);
    let workspaceName = this.workspaceName;
    let self = this;
    return this.workspaceService.move(node.text, sourcepath, targetpath, workspaceName)
        .then(function (sourceParentNode, tagetParentNode) {
            self.refresh(sourceParentNode, true);
            self.refresh(tagetParentNode, true).then(function () {
                self.messageHub.announceFileMoved(node.text, sourcepath, targetpath, workspaceName);
            });
        }.bind(this, sourceParentNode, tagetParentNode))
        .finally(function () {
            this.refresh();
        }.bind(this));
};
WorkspaceTreeAdapter.prototype.allPathsInSelection = function (selection) {
    let paths = [];
    for (let i = 0; i < selection.length; i++) {
        if (selection[i].path)
            paths.push({ id: selection[i].id, path: selection[i].path, type: selection[i].type });
        if (selection[i].files) {
            let internal_paths = this.allPathsInSelection(selection[i].files);
            paths = paths.concat(internal_paths);
        }
        if (selection[i].folders) {
            let internal_paths = this.allPathsInSelection(selection[i].folders);
            paths = paths.concat(internal_paths);
        }
    }
    return paths;
};
WorkspaceTreeAdapter.prototype.removeKnownRoot = function (paths, root) {
    return paths.filter(node => node.path != root).map(
        (elem) => {
            if (elem.path.slice(0, root.length + 1) === `${root}/` && (!elem.norootpath || elem.norootpath == elem.path)) {
                return { ...elem, norootpath: elem.path.slice(root.length + 1) }
            }
            else
                return { ...elem, norootpath: elem.norootpath ? elem.norootpath : elem.path };
        })
};
WorkspaceTreeAdapter.prototype.removeRootsFromCopied = function (all_paths_selected, nodes_selected) {
    let paths = all_paths_selected;
    for (let i = 0; i < nodes_selected.length; i++) {
        paths = this.removeKnownRoot(paths,
            nodes_selected[i].path.slice(0, nodes_selected[i].path.length - nodes_selected[i].name.length - 1));
    }
    return paths;
};
WorkspaceTreeAdapter.prototype.fileCopyConflicts = function (node) {
    let pathsInCopy = this.allPathsInSelection(this.nodes_selected);
    let pathsInPaste = this.allPathsInSelection([node.original._file]);

    let unrootedPathInCopy = this.removeRootsFromCopied(pathsInCopy, this.nodes_selected);
    let unrootedPathInPaste = this.removeKnownRoot(pathsInPaste, pathsInPaste[0].path)

    let conflicts = [];
    for (let i = 0; i < unrootedPathInCopy.length; i++) {
        for (let j = 0; j < unrootedPathInPaste.length; j++) {
            if (unrootedPathInCopy[i].norootpath === unrootedPathInPaste[j].norootpath &&
                (unrootedPathInCopy[i].type === 'file' || unrootedPathInPaste[j].type === 'file')) {
                conflicts.push({
                    norootpath: unrootedPathInCopy[i].norootpath,
                    source: unrootedPathInCopy[i].path,
                    destinaton: unrootedPathInPaste[j].path
                });
                break;
            }
        }
    }
    this.paths_selected = unrootedPathInCopy;
    return conflicts;
};
WorkspaceTreeAdapter.prototype.copyNode = function (sourceParentNode, node) {
    //strip the "/{workspace}" segment from paths and the file segment from source path (for consistency)
    let sourceWorkspace = sourceParentNode.original._file.path.split('/')[1];
    let sourcePath = sourceParentNode.original._file.path.substring(sourceWorkspace.length + 1);
    let targetPath;
    if ("original" in node) {
        targetPath = node.original._file.path.substring(this.workspaceName.length + 1);
    } else {
        targetPath = sourcePath;
    }
    let self = this;
    return this.workspaceService.copy(sourcePath, targetPath, sourceWorkspace, this.workspaceName)
        .then(function (sourceParentNode) {
            self.refresh(sourceParentNode, true);
            self.refresh(node, true).then(function () {
                self.messageHub.announceFileCopied(targetPath + '/' + node.text, sourcePath, targetPath);
            });
        }.bind(this, sourceParentNode, node))
        .finally(function () {
            this.refresh();
        }.bind(this));
};
WorkspaceTreeAdapter.prototype.dblClickNode = function (node) {
    let type = node.original.type;
    let parent = node;
    for (let i = 0; i < node.parents.length - 1; i++) {
        parent = this.jstree.get_node(parent.parent);
    }
    if (parent.original.git)
        node.original._file["gitName"] = parent.original.gitName;
    if (['folder', 'project'].indexOf(type) < 0)
        this.messageHub.announceFileOpen(node.original._file);
};
WorkspaceTreeAdapter.prototype.openWith = function (node, editor) {
    this.messageHub.announceFileOpen(node, editor);
};
WorkspaceTreeAdapter.prototype.clickNode = function (node) {
    this.messageHub.announceFileSelected(node.original._file);
};
WorkspaceTreeAdapter.prototype.raw = function () {
    return this.jstree;
};
WorkspaceTreeAdapter.prototype.copy = function (node) {
    this.nodes_selected = this.workspaceController.selectedNodeData;
    this.copy_node = node;
    pasteObject.canPaste = true;
    pasteObject.type = node.type;
};
WorkspaceTreeAdapter.prototype.paste = function (node) {
    if (this.copy_node && this.copy_node !== null) {
        let potential_conflicts = this.fileCopyConflicts(node);
        if (potential_conflicts.length) {
            this.workspaceController.showConflictsDialog(potential_conflicts, this.paths_selected, this.copy_node, node);
            return;
        } else {
            if (this.paths_selected.length == 1)
                this.copyNode(this.copy_node, node)
            else
                this.workspaceService.copySelection(this.paths_selected, node.original._file.path, [], this.wsTree);
        }
    }
    this.copy_node = null;
    pasteObject.canPaste = false;
};
WorkspaceTreeAdapter.prototype.refresh = function (node, keepState) {
    //TODO: This is reliable but a bit intrusive. Find out a more subtle way to update on demand
    let resourcepath;
    if (node && "original" in node) {
        resourcepath = node.original._file.path;
    } else {
        resourcepath = this.workspaceName;
    }
    return this.workspaceService.load(resourcepath)
        .then(function (_data) {
            let data = [];
            if (_data.type === 'workspace') {
                data = _data.projects;
            } else if (_data.type === 'folder' || _data.type === 'project') {
                data = [_data];
            }

            data = data.map(this._buildTreeNode.bind(this));

            if (!this.jstree.settings.core.data || _data.type === 'workspace')
                this.jstree.settings.core.data = data;
            else {
                //find and replace the loaded node
                let self = this;
                this.jstree.settings.core.data = this.jstree.settings.core.data.map(function (node) {
                    data.forEach(function (_node, replacement) {
                        if (self._fnr(_node, replacement))
                            return;
                    }.bind(self, node));
                    return node;
                });
            }
            if (!keepState)
                this.jstree.refresh();
        }.bind(this));
};
WorkspaceTreeAdapter.prototype.openNodeProperties = function (resource) {
    this.messageHub.announceFilePropertiesOpen(resource);
};
WorkspaceTreeAdapter.prototype.publish = function (resource) {
    return this.publishService.publish(resource.path)
        .then(function () {
            return this.messageHub.announcePublish(resource);
        }.bind(this));
};
WorkspaceTreeAdapter.prototype.unpublish = function (resource) {
    return this.publishService.unpublish(resource.path)
        .then(function () {
            return this.messageHub.announceUnpublish(resource);
        }.bind(this));
};
WorkspaceTreeAdapter.prototype.exportProject = function (resource) {
    if (resource.type === 'project' || resource.type == 'folder') {
        let segments = resource.path.split('/');
        let callExportPath = segments.slice(0, 3).join("/") + '/' + encodeURIComponent(segments.slice(3).join("/"));
        return this.exportService.exportProject(callExportPath);
    }
};
WorkspaceTreeAdapter.prototype.generateFile = function (resource, scope) {
    let segments = resource.path.split('/');
    this.workspaceController.projectName = segments[2];
    if (resource.type === 'project' || resource.type === 'folder') {
        segments = segments.splice(3, segments.length);
        this.workspaceController.fileName = new UriBuilder().path(segments).path("fileName").build();
        scope.$apply();
        this.workspaceController.generateFromTemplate(scope);
    } else {
        this.workspaceController.fileName = segments[segments.length - 1];
        scope.$apply();
        this.workspaceController.generateFromModel(scope);
    }
};
WorkspaceTreeAdapter.prototype.uploadFileInPlace = function (resource, scope) {
    let segments = resource.path.split('/');
    this.workspaceController.projectName = segments[2];
    if (resource.type === 'project' || resource.type === 'folder') {
        segments = segments.splice(3, segments.length);
        this.workspaceController.fileName = new UriBuilder().path(segments).build();
        scope.$apply();
        $('#uploadFile').click();
    }
};

WorkspaceTreeAdapter.prototype.uploadZipToFolder = function (resource, scope) {
    let segments = resource.path.split('/');
    this.workspaceController.projectName = segments[2];
    let relativePath = '/';
    if (resource.type == "folder") {
        relativePath = this.removeKnownRoot([resource], "/" + this.workspaceController.selectedWorkspace + "/" + this.workspaceController.projectName)[0].norootpath;
    }
    this.workspaceController.showImportFromZipDialog(this.workspaceController.selectedWorkspace, this.workspaceController.projectName, relativePath);
};

let TemplatesService = function ($http, $window, TEMPLATES_SVC_URL) {
    this.$http = $http;
    this.$window = $window;
    this.TEMPLATES_SVC_URL = TEMPLATES_SVC_URL;
};
TemplatesService.prototype.listTemplates = function () {
    let url = new UriBuilder().path(this.TEMPLATES_SVC_URL.split('/')).build();
    return this.$http.get(url).then(function (response) { return response.data; });
};

angular.module('workspace.config', [])
    .constant('WS_SVC_URL', '/services/v8/ide/workspaces')
    .constant('WS_SVC_MANAGER_URL', '/services/v8/ide/workspace')
    .constant('PUBLISH_SVC_URL', '/services/v8/ide/publisher/request')
    .constant('EXPORT_SVC_URL', '/services/v8/transport/project')
    .constant('TEMPLATES_SVC_URL', '/services/v8/js/resources-core/services/templates.js')
    .constant('GENERATION_SVC_URL', '/services/v8/ide/generate');

angular.module('workspace', ['workspace.config', 'ideUiCore', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'angularFileUpload'])
    .factory('httpRequestInterceptor', function () {
        let csrfToken = null;
        return {
            request: function (config) {
                config.headers['X-Requested-With'] = 'Fetch';
                config.headers['X-CSRF-Token'] = csrfToken ? csrfToken : 'Fetch';
                return config;
            },
            response: function (response) {
                let token = response.headers()['x-csrf-token'];
                if (token) {
                    csrfToken = token;
                }
                return response;
            }
        };
    })
    .config(['$httpProvider', function ($httpProvider) {
        //check if response is error. errors currently are non-json formatted and fail too early
        $httpProvider.defaults.transformResponse.unshift(function (data, headersGetter, status) {
            if (status > 399) {
                data = {
                    "error": data
                };
                data = JSON.stringify(data);
            }
            return data;
        });
        $httpProvider.interceptors.push('httpRequestInterceptor');
    }])
    .factory('messageHub', [function () {
        let messageHub = new FramesMessageHub();
        let send = function (evtName, data, absolute) {
            messageHub.post({ data: data }, (absolute ? '' : 'workspace.') + evtName);
        };
        let announceFileSelected = function (fileDescriptor) {
            this.send('file.selected', fileDescriptor);
        };
        let announceFileCreated = function (fileDescriptor) {
            this.send('file.created', fileDescriptor);
        };
        let announceFileOpen = function (fileDescriptor, editor) {
            let extraArgs;
            if (fileDescriptor.gitName) {
                extraArgs = {
                    gitName: fileDescriptor.gitName
                }
            }
            messageHub.post({
                resourcePath: fileDescriptor.path,
                resourceLabel: fileDescriptor.label,
                contentType: fileDescriptor.contentType,
                editorId: editor,
                extraArgs: extraArgs
            }, 'ide-core.openEditor');
        };
        let announceFileDeleted = function (fileDescriptor) {
            this.send(
                'ide-core.closeEditor',
                {
                    fileName: fileDescriptor.path
                },
                true
            );
        };
        let announceFileRenamed = function (fileDescriptor, oldName, newName) {
            this.send(
                'ide-core.closeEditor',
                {
                    fileName: fileDescriptor.path
                },
                true
            );
        };
        let announceFileMoved = function (fileDescriptor, sourcepath, targetpath, workspace) {
            this.send(
                'ide-core.closeEditor',
                {
                    fileName: `/${workspace}${sourcepath}/${fileDescriptor}`
                },
                true
            );
        };
        let announceFileCopied = function (fileDescriptor, sourcepath, targetpath) {
            let data = {
                "file": fileDescriptor,
                "sourcepath": sourcepath,
                "targetpath": targetpath
            };
            this.send('file.copied', data);
        };
        let announceFilePropertiesOpen = function (fileDescriptor) {
            this.send('file.properties', fileDescriptor);
        };
        let announcePublish = function (fileDescriptor) {
            this.send('file.published', fileDescriptor);
        };
        let announceUnpublish = function (fileDescriptor) {
            this.send('file.unpublished', fileDescriptor);
        };
        let announceExport = function (fileDescriptor) {
            this.send('project.exported', fileDescriptor);
        };
        return {
            send: send,
            announceFileSelected: announceFileSelected,
            announceFileCreated: announceFileCreated,
            announceFileOpen: announceFileOpen,
            announceFileDeleted: announceFileDeleted,
            announceFileRenamed: announceFileRenamed,
            announceFileMoved: announceFileMoved,
            announceFileCopied: announceFileCopied,
            announceFilePropertiesOpen: announceFilePropertiesOpen,
            announcePublish: announcePublish,
            announceUnpublish: announceUnpublish,
            announceExport: announceExport,
            on: function (evt, cb) {
                messageHub.subscribe(cb, evt);
            }
        };
    }])
    .factory('$treeConfig.openmenuitem', ['Editors', function (Editors) {
        let OpenMenuItemFactory = function (Editors) {
            let openWithEventName = this.openWithEventName = 'jstree.workspace.openWith';
            let editorsForContentType = Editors.editorsForContentType;

            let getEditorsForContentType = function (contentType) {
                if (Object.keys(editorsForContentType).indexOf(contentType) > -1) {
                    return editorsForContentType[contentType];
                }
                return editorsForContentType[""];
            };

            let onOpenWithEditorAction = function (editor, data) {
                let tree = $.jstree.reference(data.reference);
                let node = tree.get_node(data.reference);
                let parent = node;
                for (let i = 0; i < node.parents.length - 1; i++) {
                    parent = tree.get_node(parent.parent);
                }
                if (parent.original.git)
                    node.original._file["gitName"] = parent.original.gitName;
                tree.element.trigger(openWithEventName, [node.original._file, editor]);
            };

            let createOpenEditorMenuItem = function (editorId, label) {
                return {
                    "label": label,
                    "action": onOpenWithEditorAction.bind(this, editorId)
                };
            };

            let createOpenWithSubmenu = function (editors) {
                editorsSubmenu = {};
                if (editors) {
                    editors.forEach(function (editor) {
                        editorsSubmenu[editor.id] = createOpenEditorMenuItem(editor.id, editor.label);
                    }.bind(this));
                }
                return editorsSubmenu;
            };

            /**
             * Depending on the number of assignable editors for the file content type, this mehtod
             * will create Open (singular eidtor) or Open with... choice dropdown for multiple editors.
             */
            this.createOpenFileMenuItem = function (ctxmenu, node) {
                let contentType = node.original._file.contentType || "";
                let editors = getEditorsForContentType(contentType);
                if (!editors) editors = [{ id: Editors.defaultEditorId }];
                if (editors.length > 1) {
                    ctxmenu.openWith = {
                        "label": "Open with...",
                        "submenu": createOpenWithSubmenu.call(this, editors)
                    };
                } else {
                    ctxmenu.open = createOpenEditorMenuItem(editors[0].id, 'Open');
                }
            };
        };

        let openMenuItemFactory = new OpenMenuItemFactory(Editors);

        return openMenuItemFactory;
    }])
    .factory('$treeConfig', ['$treeConfig.openmenuitem', '$http', function (openmenuitem, $http) {

        // get the new by template extensions
        let templates = $.ajax({
            type: "GET",
            url: '/services/v8/js/ide-workspace/services/workspace-menu-new-templates.js',
            cache: false,
            async: false
        }).responseText;

        // get file extensions with available generation templates
        let fileExtensions = $.ajax({
            type: "GET",
            url: '/services/v8/js/resources-core/services/templates.js/extensions',
            cache: false,
            async: false
        }).responseText;

        // get available generation templates count
        let templatesCountNonFile = parseInt($.ajax({
            type: "GET",
            url: '/services/v8/js/resources-core/services/templates.js/count',
            cache: false,
            async: false
        }).responseText);

        let priorityFileTemplates = JSON.parse(templates).filter(e => e.order !== undefined).sort((a, b) => a.order - b.order);
        let specificFileTemplates = JSON.parse(templates).filter(e => e.order === undefined);
        let post_no_edit_URL = '/services/v8/ide/workspaces/';

        for (let i = 0; i < priorityFileTemplates.length; i++) {
            if (priorityFileTemplates[i].isModel) {
                models.push(priorityFileTemplates[i].extension);
            }
        }

        for (let i = 0; i < specificFileTemplates.length; i++) {
            if (specificFileTemplates[i].isModel) {
                models.push(specificFileTemplates[i].extension);
            }
        }

        return {
            'core': {
                'themes': {
                    "name": "default",
                    "responsive": false,
                    "dots": false,
                    "icons": true,
                    'variant': 'small',
                    'stripes': true
                },
                'check_callback': function (o, n, p, i, m) {
                    if (m && m.dnd && m.pos !== 'i') { return false; }
                    if (o === "move_node" || o === "copy_node") {
                        if (this.get_node(n).parent === this.get_node(p).id) { return false; }
                    }
                    if (o === 'delete_node') {
                        return false;
                    }
                    return true;
                }
            },
            'plugins': ['state', 'dnd', 'sort', 'types', 'contextmenu'],
            "types": {
                "default": {
                    "icon": "fa fa-file-o",
                    "default_name": "file",
                    "template_new_name": "{name}{counter}"
                },
                'file': {
                    "valid_children": []
                },
                'folder': {
                    "default_name": "folder",
                    'icon': "fa fa-folder-o"
                },
                "project": {
                    "icon": "fa fa-pencil-square-o"
                }
            },
            "contextmenu": {
                "items": function (node) {
                    let _ctxmenu = $.jstree.defaults.contextmenu.items();
                    let ctxmenu = {};
                    if (this.get_type(node) === "file") {
                        /*Open/Open with...*/
                        openmenuitem.createOpenFileMenuItem(ctxmenu, node);
                    } else {
                        /*New*/
                        ctxmenu.create = _ctxmenu.create;
                        delete ctxmenu.create.action;
                        ctxmenu.create.label = "New";

                        let new_submenu = {
                            /*Folder*/
                            "create_folder": {
                                "label": "Folder",
                                "action": function (data) {
                                    let tree = data.reference.jstree(true);
                                    let parentNode = tree.get_node(data.reference);
                                    let folderNode = {
                                        type: 'folder'
                                    };
                                    tree.create_node(parentNode, folderNode, "last", function (new_node) {
                                        tree.edit(new_node);
                                    });
                                }
                            },
                            /*File*/
                            "create_file": {
                                "separator_after": true,
                                "label": "File",
                                "action": function (tree, data) {
                                    let parentNode = tree.get_node(data.reference);
                                    let fileNode = {
                                        type: 'file'
                                    };
                                    tree.create_node(parentNode, fileNode, "last", function (new_node) {
                                        tree.edit(new_node);
                                    });
                                }.bind(self, this)
                            }
                        };
                        ctxmenu.create.submenu = new_submenu;
                    }

                    if (ctxmenu.create) {
                        let nodeChildren = node.original._file.files.map(x => x.name);

                        for (let i = 0; i < priorityFileTemplates.length; i++) {
                            let fileTemplate = priorityFileTemplates[i];
                            let isDisabled = false;
                            if (fileTemplate.oncePerFolder) {
                                for (let nc = 0; nc < nodeChildren.length; nc++) {
                                    if (fileTemplate.nameless && nodeChildren[nc] === `.${fileTemplate.extension}` || nodeChildren[nc].endsWith(`.${fileTemplate.extension}`)) {
                                        isDisabled = true;
                                        break;
                                    }
                                }
                            }
                            ctxmenu.create.submenu[fileTemplate.name] = {
                                "_disabled": isDisabled,
                                "separator_after": (i + 1 === priorityFileTemplates.length),
                                "label": fileTemplate.label,
                                "action": function (wnd, data) {
                                    let tree = $.jstree.reference(data.reference);
                                    let parentNode = tree.get_node(data.reference);
                                    let fileNode = {
                                        type: 'file',
                                        data: fileTemplate.data,
                                    };
                                    if (fileTemplate.nameless) {
                                        fileNode.text = `.${fileTemplate.extension}`;
                                    } else {
                                        fileNode.text = `file.${fileTemplate.extension}`;
                                    }
                                    if (fileTemplate.staticName) {
                                        let url = new UriBuilder().path(post_no_edit_URL.split('/')).path(parentNode.original._file.path.split('/')).path(fileNode.text).build();
                                        $http.post(url, fileNode.data, {
                                            headers: {
                                                "Content-Type": "text/plain;charset=UTF-8"
                                            }
                                        }).then(function (response) {
                                            $('#refreshButton').click();
                                        });
                                    } else {
                                        tree.create_node(parentNode, fileNode, "last", function (new_node) {
                                            tree.edit(new_node);
                                        });
                                    }
                                }.bind(self, this)
                            };
                        }

                        for (let i = 0; i < specificFileTemplates.length; i++) {
                            let fileTemplate = specificFileTemplates[i];
                            let isDisabled = false;
                            if (fileTemplate.oncePerFolder) {
                                for (let nc = 0; nc < nodeChildren.length; nc++) {
                                    if (fileTemplate.nameless && nodeChildren[nc] === `.${fileTemplate.extension}` || nodeChildren[nc].endsWith(`.${fileTemplate.extension}`)) {
                                        isDisabled = true;
                                        break;
                                    }
                                }
                            }
                            ctxmenu.create.submenu[fileTemplate.name] = {
                                "_disabled": isDisabled,
                                "label": fileTemplate.label,
                                "action": function (wnd, data) {
                                    let tree = $.jstree.reference(data.reference);
                                    let parentNode = tree.get_node(data.reference);
                                    let fileNode = {
                                        type: 'file',
                                        data: fileTemplate.data
                                    };
                                    if (fileTemplate.nameless) {
                                        fileNode.text = `.${fileTemplate.extension}`;
                                    } else {
                                        fileNode.text = `file.${fileTemplate.extension}`;
                                    }
                                    if (fileTemplate.staticName) {
                                        let url = new UriBuilder().path(post_no_edit_URL.split('/')).path(parentNode.original._file.path.split('/')).path(fileNode.text).build();
                                        $http.post(url, fileNode.data, {
                                            headers: {
                                                "Content-Type": "text/plain;charset=UTF-8"
                                            }
                                        }).then(function (response) {
                                            $('#refreshButton').click();
                                        });
                                    } else {
                                        tree.create_node(parentNode, fileNode, "last", function (new_node) {
                                            tree.edit(new_node, fileNode.text);
                                        });
                                    }
                                }.bind(self, this)
                            };
                        }
                    }

                    /*Copy*/
                    ctxmenu.copy = {
                        "separator_before": true,
                        "label": "Copy",
                        "action": function (data) {
                            let tree = $.jstree.reference(data.reference);
                            let node = tree.get_node(data.reference);
                            tree.element.trigger('jstree.workspace.copy', [node]);
                        }.bind(this)
                    };

                    /*
                    Paste shouldn't be visible if there is nothing to paste.
                    Paste shouldn't be visible if the copied node is of type project and another node is selected.
                    Pasting projects is handled by the context menu defined in 'WorkspaceTreeAdapter.prototype.init'
                    */
                    if (this.get_type(node) !== "file" && pasteObject.type !== "project") {
                        /*Paste*/
                        ctxmenu.paste = {
                            "_disabled": !pasteObject.canPaste,
                            "separator_before": false,
                            "label": "Paste",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.paste', [node]);
                            }.bind(this)
                        };
                    }

                    /*Rename*/
                    ctxmenu.rename = _ctxmenu.rename;
                    ctxmenu.rename.shortcut = 113;
                    ctxmenu.rename.shortcut_label = 'F2';
                    ctxmenu.rename.separator_before = true;

                    /*Remove*/
                    ctxmenu.remove = _ctxmenu.remove;
                    ctxmenu.remove.shortcut = 46;
                    ctxmenu.remove.shortcut_label = 'Del';
                    ctxmenu.remove.action = function (data) {
                        let tree = $.jstree.reference(data.reference);
                        let node = tree.get_node(data.reference);
                        tree.element.trigger('jstree.workspace.delete', [node.original._file]);
                    }.bind(this)

                    /*Publish*/
                    ctxmenu.publish = {
                        "separator_before": true,
                        "label": "Publish",
                        "action": function (data) {
                            let tree = $.jstree.reference(data.reference);
                            let node = tree.get_node(data.reference);
                            tree.element.trigger('jstree.workspace.publish', [node.original._file]);
                        }.bind(this)
                    };
                    /*Unpublish*/
                    ctxmenu.unpublish = {
                        "separator_before": false,
                        "label": "Unpublish",
                        "action": function (data) {
                            let tree = $.jstree.reference(data.reference);
                            let node = tree.get_node(data.reference);
                            tree.element.trigger('jstree.workspace.unpublish', [node.original._file]);
                        }.bind(this)
                    };

                    if (this.get_type(node) !== "file" && templatesCountNonFile > 0) {
                        /*Generate*/
                        ctxmenu.generate = {
                            "separator_before": true,
                            "label": "Generate",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.generate', [node.original._file]);
                            }.bind(this)
                        };

                        /*Upload*/
                        ctxmenu.upload = {
                            "separator_before": true,
                            "label": "Upload",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.upload', [node.original._file]);
                            }.bind(this)
                        };
                    }

                    let ext = node.original._file.path.substring(node.original._file.path.lastIndexOf(".") + 1, node.original._file.path.length);
                    if (this.get_type(node) === "file" && fileExtensions.includes(ext)) {
                        /*Generate Model*/
                        ctxmenu.generate = {
                            "separator_before": true,
                            "label": "Generate",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.generate', [node.original._file]);
                            }.bind(this)
                        };
                    }

                    if (this.get_type(node) === "folder" || this.get_type(node) == "project") {
                        /*Import from zip*/
                        ctxmenu.uploadZipToFolder = {
                            "separator_before": true,
                            "label": "Import files from ZIP",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.uploadZipToFolder', [node.original._file]);
                            }.bind(this)
                        };
                    }

                    if (this.get_type(node) === "project" || this.get_type(node) === "folder") {
                        /*Export*/
                        ctxmenu.exportProject = {
                            "separator_before": true,
                            "label": "Export",
                            "action": function (data) {
                                let tree = $.jstree.reference(data.reference);
                                let node = tree.get_node(data.reference);
                                tree.element.trigger('jstree.workspace.export', [node.original._file]);
                            }.bind(this)
                        };
                    }

                    return ctxmenu;
                }
            }
        };
    }])
    .factory('publishService', ['$http', 'PUBLISH_SVC_URL', function ($http, PUBLISH_SVC_URL) {
        return {
            publish: function (resourcePath) {
                let url = new UriBuilder().path(PUBLISH_SVC_URL.split('/')).path(resourcePath.split('/')).build();
                return $http.post(url, {}, {
                    headers: {
                        "Dirigible-Editor": "Publish"
                    }
                });
            },
            unpublish: function (resourcePath) {
                let url = new UriBuilder().path(PUBLISH_SVC_URL.split('/')).path(resourcePath.split('/')).build();
                return $http.delete(url, {
                    headers: {
                        "Dirigible-Editor": "Publish"
                    }
                });
            }
        };
    }])
    .factory('exportService', ['$http', '$window', 'EXPORT_SVC_URL', function ($http, $window, EXPORT_SVC_URL) {
        return {
            exportProject: function (resourcePath) {
                let url = new UriBuilder().path(EXPORT_SVC_URL.split('/')).path(resourcePath.split('/')).build();
                $window.open(url);
            }
        };
    }])
    .factory('generationService', ['$http', 'GENERATION_SVC_URL', function ($http, GENERATION_SVC_URL) {
        return {
            generateFromTemplate: function (workspace, project, file, template, parameters, wsTree) {
                let url = new UriBuilder().path(GENERATION_SVC_URL.split('/')).path('file').path(workspace).path(project).path(file.split('/')).build();
                parameters = parameters === undefined || parameters === null ? [] : parameters;
                return $http.post(url, { "template": template, "parameters": parameters })
                    .then(function (response) {
                        wsTree.refresh();
                        return response.data;
                    });
            },
            generateFromModel: function (workspace, project, file, template, parameters, wsTree) {
                let url = new UriBuilder().path(GENERATION_SVC_URL.split('/')).path('model').path(workspace).path(project).path(file.split('/')).build();
                parameters = parameters === undefined || parameters === null ? [] : parameters;
                return $http.post(url, { "template": template, "parameters": parameters, "model": file })
                    .then(function (response) {
                        wsTree.refresh();
                        return response.data;
                    });
            }
        };
    }])
    .factory('templatesService', ['$http', '$window', 'TEMPLATES_SVC_URL', function ($http, $window, TEMPLATES_SVC_URL) {
        return new TemplatesService($http, $window, TEMPLATES_SVC_URL);
    }])
    .factory('workspaceService', ['$http', '$window', 'WS_SVC_MANAGER_URL', 'WS_SVC_URL', '$treeConfig', function ($http, $window, WS_SVC_MANAGER_URL, WS_SVC_URL, $treeConfig) {
        return new WorkspaceService($http, $window, WS_SVC_MANAGER_URL, WS_SVC_URL, $treeConfig);
    }])
    .factory('workspaceTreeAdapter', ['$treeConfig', 'workspaceService', 'publishService', 'exportService', 'messageHub', function ($treeConfig, WorkspaceService, publishService, exportService, messageHub) {
        return new WorkspaceTreeAdapter($treeConfig, WorkspaceService, publishService, exportService, messageHub);
    }])
    .controller('WorkspaceController', ['workspaceService', 'FileUploader', 'workspaceTreeAdapter', 'publishService', 'exportService', 'templatesService', 'generationService', 'messageHub', '$scope', function (workspaceService, FileUploader, workspaceTreeAdapter, publishService, exportService, templatesService, generationService, messageHub, $scope) {
        $scope.selectedNodeType = "";
        this.wsTree;
        this.workspaces;
        this.selectedTemplate;
        this.workspaceService = workspaceService;
        this.unpublishOnDelete = true;
        this.workspaceTreeAdapter = workspaceTreeAdapter;
        this.conflictApplyAll = false;
        $scope.copyConflicts = [];
        $scope.resolvedConflicts = [];
        $scope.copyWhich = [];
        $scope.copyTo = {};
        $scope.projectName = '';
        $scope.pathToImportIn = '';

        $scope.TRANSPORT_PROJECT_URL = "/services/v8/transport/project";
        $scope.TRANSPORT_ZIPTOFOLDER_URL = "/services/v8/transport/zipimport";

        // FILE UPLOADER
        $scope.uploader = uploader = new FileUploader({
            url: $scope.TRANSPORT_ZIPTOFOLDER_URL,
            removeAfterUpload: true
        });

        // UPLOADER FILTERS
        uploader.filters.push({
            name: 'customFilter',
            fn: function (item /*{File|FileLikeObject}*/, options) {
                let type = item.type.slice(item.type.lastIndexOf('/') + 1);
                if (type != 'zip' && type != 'x-zip') {
                    return false;
                }
                return this.queue.length < 100;
            }
        });

        // UPLOADER CALLBACKS
        uploader.onBeforeUploadItem = function (item) {
            let internalPath = $scope.pathToImportIn;
            let pathSegments = [$scope.selectedWorkspace, $scope.projectName, encodeURIComponent(internalPath)];
            let buildPath = new UriBuilder();
            buildPath.path(pathSegments)
            item.url = $scope.TRANSPORT_ZIPTOFOLDER_URL + buildPath.build();
            $scope.uploader.url = item.url;
        };

        uploader.onCompleteAll = function () {
            this.clearQueue();
            $('#uploadZipToFolder').click();
            $('#refreshButton').click();
        };

        this.cancelImportFromZip = function (uploader) {
            if (uploader.isUploading)
                uploader.cancelAll();
            uploader.clearQueue();
        }

        this.okUploadZipFiles = function (uploader) {
            uploader.uploadAll();
        }

        this.showDeleteDialog = function (type) {
            this.unpublishOnDelete = true;
            $scope.selectedNodeType = type;
            $scope.$apply(); // Because of JQuery and the bootstrap modal
            $('#deleteProject').click();
        };

        this.showConflictsDialog = function (conflicts, copyWhich, copyNode, copyTo) {
            $scope.copyConflicts = conflicts;
            $scope.resolvedConflicts = [];
            $scope.copyWhich = copyWhich;
            $scope.copyTo = copyTo;
            $scope.copyNode = copyNode;
            $scope.$apply(); // Because of JQuery and the bootstrap modal
            $('#resolveConflicts').click();
        }

        this.showImportFromZipDialog = function (workspace, project, pathToImportIn) {
            $scope.selectedWorkspace = workspace;
            $scope.projectName = project;
            $scope.pathToImportIn = pathToImportIn;
            $scope.$apply(); // Because of JQuery and the bootstrap modal
            $('#uploadZipToFolder').click();
        }

        this.resolveConflict = function (resolution) {
            let startRange = $scope.resolvedConflicts.length;
            let endRange = this.conflictApplyAll ? $scope.copyConflicts.length : $scope.resolvedConflicts.length + 1;
            for (let i = startRange; i < endRange; i++)
                $scope.resolvedConflicts.push({ ...$scope.copyConflicts[i], resolution: resolution });
            if ($scope.resolvedConflicts.length == $scope.copyConflicts.length) {
                this.workspaceService.copySelection($scope.copyWhich, $scope.copyTo.original._file.path, $scope.resolvedConflicts);
                $('#resolveConflicts').click();
            }
        }
        this.cancelCopy = function () {
            $scope.resolvedConflicts = [];
        }

        this.refreshTemplates = function () {
            templatesService.listTemplates()
                .then(function (data) {
                    this.templates = data;
                    this.modelTemplates = [];
                    this.genericTemplates = [];
                    this.templateParameters = [];
                    for (let i = 0; i < this.templates.length; i++) {
                        this.templateParameters[this.templates[i].id] = this.templates[i].parameters;
                        //					if (this.templates[i].model) {
                        //						this.modelTemplates.push(this.templates[i]);
                        //					}
                    }
                }.bind(this));
        };
        this.refreshTemplates();

        this.filterModelTemplates = function (ext) {
            this.modelTemplates.length = 0;
            this.templates.forEach(template => { if (template.extension === ext) this.modelTemplates.push(template); });
        };

        this.filterGenericTemplates = function () {
            this.genericTemplates.length = 0;
            this.templates.forEach(template => { if (template.extension === undefined || template.extension === null) this.genericTemplates.push(template); });
        };

        this.refreshWorkspaces = function () {
            workspaceService.listWorkspaceNames()
                .then(function (workspaceNames) {
                    this.workspaces = workspaceNames;
                    if (this.workspaceName) {
                        this.selectedWorkspace = this.workspaceName;
                        this.workspaceSelected();
                    } else {
                        let storedWorkspace = JSON.parse(localStorage.getItem('DIRIGIBLE.workspace') || '{}');
                        if ('name' in storedWorkspace) {
                            this.selectedWorkspace = storedWorkspace.name;
                            this.workspaceSelected();
                        } else {
                            this.selectedWorkspace = 'workspace'; // Default
                            localStorage.setItem('DIRIGIBLE.workspace', JSON.stringify({ "name": this.selectedWorkspace }));
                            this.workspaceSelected();
                        }
                    }
                }.bind(this));
        };
        this.refreshWorkspaces();

        this.workspaceSelected = function () {
            if (this.wsTree) {
                this.wsTree.workspaceName = this.selectedWorkspace;
                this.wsTree.refresh();
                return;
            }
            this.wsTree = workspaceTreeAdapter.init($('.workspace'), this, $scope);
            if (!workspaceService.typeMapping)
                workspaceService.typeMapping = $treeConfig[types];
            this.wsTree.refresh();
        };

        this.createWorkspace = function () {
            $('#createWorkspace').click();
        };
        this.okCreateWorkspace = function () {
            if (this.workspaceName) {
                workspaceService.createWorkspace(this.workspaceName);
                this.refreshWorkspaces();
            }
        };

        this.createProject = function () {
            $('#createProject').click();
        };
        this.okCreateProject = function () {
            if (this.projectName) {
                workspaceService.createProject(this.selectedWorkspace, this.projectName, this.wsTree);
            }
        };
        this.okDelete = function () {
            for (let i = 0; i < this.selectedNodeData.length; i++) {
                let selected_node = this.selectedNodeData[i];
                if (this.unpublishOnDelete) {
                    publishService.unpublish(selected_node.path)
                        .then(function () {
                            return messageHub.announceUnpublish(selected_node);
                        }.bind(this));
                }
                if (selected_node.type === "project") {
                    workspaceService.deleteProject(this.selectedWorkspace, selected_node, this.wsTree);
                } else {
                    workspaceTreeAdapter.deleteNode(selected_node);
                }
            }
        };

        this.linkProject = function () {
            $('#linkProject').click();
        };
        this.okLinkProject = function () {
            if (this.projectName && this.linkedPath) {
                workspaceService.linkProject(this.selectedWorkspace, this.projectName, this.linkedPath, this.wsTree);
            }
        };

        this.generateFromTemplate = function (scope) {
            this.filterGenericTemplates();
            scope.$apply();
            $('#generateFromTemplate').click();
        };
        this.okGenerateFromTemplate = function () {
            if (this.projectName) {
                generationService.generateFromTemplate(this.selectedWorkspace, this.projectName, this.fileName, this.selectedTemplate, this.parameters, this.wsTree);
            }
        };

        this.generateFromModel = function (scope) {
            let ext = getFileExtension(this.fileName);
            this.filterModelTemplates(ext);
            scope.$apply();
            $('#generateFromModel').click();
        };
        this.okGenerateFromModel = function () {
            if (this.projectName) {
                generationService.generateFromModel(this.selectedWorkspace, this.projectName, this.fileName, this.selectedTemplate, this.parameters, this.wsTree);
            }
        };
        this.shouldShow = function (property) {
            let shouldShow = true;
            if (property.ui && property.ui.hide && this.parameters) {
                if (this.parameters[property.ui.hide.property] !== undefined) {
                    shouldShow = this.parameters[property.ui.hide.property] !== property.ui.hide.value;
                } else {
                    shouldShow = property.ui.hide.value;
                }
            } else if (property.ui && property.ui.hide && this.parameters === undefined) {
                shouldShow = property.ui.hide.value;
            }
            return shouldShow;
        };
        this.shouldShowText = function (property) {
            return property.type === undefined || property.type === 'text';
        };
        this.shouldShowCheckbox = function (property) {
            return property.type === 'checkbox';
        };

        this.publish = function () {
            publishService.publish(this.selectedWorkspace + '/*')
                .then(function () {
                    return messageHub.announcePublish(this.selectedWorkspace + '/*');
                }.bind(this));
        };

        this.unpublish = function () {
            publishService.unpublish(this.selectedWorkspace + '/*')
                .then(function () {
                    return messageHub.announceUnpublish(this.selectedWorkspace + '/*');
                }.bind(this));
        };

        this.exportWorkspace = function () {
            exportService.exportProject(this.selectedWorkspace + '/*');
        };

        this.refresh = function () {
            this.wsTree.refresh();
        };

        this.saveAll = function () {
            messageHub.send('workbench.editor.save', { data: "" }, true);
        };

        this.uploadFile = function () {
            $('#uploadFile').click();
        };
        this.okUploadFile = function () {
            let f = document.getElementById('uploadFileField').files[0],
                r = new FileReader();
            let name = f.name;
            let path = '/' + this.selectedWorkspace + '/' + this.projectName + (this.fileName ? '/' + this.fileName : '');

            r.onloadend = function (e) {
                let data = e.target.result;
                let node = {};
                node.type = 'file';
                node.data = data;
                workspaceService.uploadFile(name, path, node);
                messageHub.send('workspace.file.uploaded', { data: "" }, true);
            };

            r.readAsBinaryString(f);
        };

        messageHub.on('editor.file.saved', function (msg) {
            let filePath = msg.data;
            // TODO auto-publish configuration
            publishService.publish(filePath).then(function (filePath) {
                return messageHub.announcePublish();
            }.bind(this));
        }.bind(this), true);

        messageHub.on('workspace.create.workspace', function (msg) {
            $('#createWorkspace').click();
        }.bind(this), true);

        messageHub.on('workspace.create.project', function (msg) {
            $('#createProject').click();
        }.bind(this), true);

        messageHub.on('workspace.link.project', function (msg) {
            $('#linkProject').click();
        }.bind(this), true);

        messageHub.on('workspace.publish.all', function (msg) {
            publishService.publish(this.selectedWorkspace + '/*');
        }.bind(this), true);

        messageHub.on('workspace.export.all', function (msg) {
            exportService.exportProject(this.selectedWorkspace + '/*');
        }.bind(this), true);

        messageHub.on('workspace.file.uploaded', function (msg) {
            workspaceTreeAdapter.refresh();
        }.bind(this), true);

        messageHub.on('workspace.refresh', function (msg) {
            workspaceTreeAdapter.refresh();
        }.bind(this), true);

        //$.jstree.defaults.unique.case_sensitive = true;

    }]);

const images = ['png', 'jpg', 'jpeg', 'gif'];
const models = ['extension', 'extensionpoint', 'edm', 'model', 'dsm', 'schema', 'bpmn', 'job', 'listener', 'websocket', 'roles', 'constraints', 'table', 'view'];

function getIcon(f) {
    let icon;
    if (f.type === 'project' && f.git) {
        icon = "fa fa-git-square";
    } else if (f.type === 'file') {
        let ext = getFileExtension(f.name);
        if (ext === 'js' || ext === 'mjs' || ext === 'xsjs') {
            icon = "fa fa-file-code-o";
        } else if (ext === 'html') {
            icon = "fa fa-html5";
        } else if (ext === 'css') {
            icon = "fa fa-css3";
        } else if (ext === 'txt' || ext === 'json') {
            icon = "fa fa-file-text-o";
        } else if (images.indexOf(ext) !== -1) {
            icon = "fa fa-file-image-o";
        } else if (models.indexOf(ext) !== -1) {
            icon = "fa fa-file-text";
        } else {
            icon = "fa fa-file-o";
        }
    }
    return icon;
}

function getFileExtension(f) {
    return f.substring(f.lastIndexOf(".") + 1, f.length);
}
