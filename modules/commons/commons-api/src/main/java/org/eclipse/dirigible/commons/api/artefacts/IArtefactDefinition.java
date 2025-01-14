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
package org.eclipse.dirigible.commons.api.artefacts;

/**
 * The Interface IArtefactDefinition.
 */
public interface IArtefactDefinition {

	/**
	 * Gets the artefact name.
	 *
	 * @return the artefact name
	 */
	public String getArtefactName();

	/**
	 * Gets the artefact location.
	 *
	 * @return the artefact location
	 */
	public String getArtefactLocation();

}
