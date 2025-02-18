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
package org.eclipse.dirigible.cms.db.api;

import org.eclipse.dirigible.cms.db.CmsDatabaseRepository;

/**
 * A factory for creating CmisRepository objects.
 */
public class CmisRepositoryFactory {

	/**
	 * Creates a new CmisRepository object.
	 *
	 * @param repository the repository
	 * @return the cmis repository
	 */
	public static CmisRepository createCmisRepository(CmsDatabaseRepository repository) {
		return new CmisDatabaseRepository(repository);
	}

}
