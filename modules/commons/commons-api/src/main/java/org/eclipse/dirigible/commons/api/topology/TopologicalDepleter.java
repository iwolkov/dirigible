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
package org.eclipse.dirigible.commons.api.topology;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * The Class TopologicalDepleter.
 *
 * @param <T> the generic type
 */
public class TopologicalDepleter<T extends ITopologicallyDepletable> {
	
	/**
	 * Deplete.
	 *
	 * @param list the list
	 * @param flow the flow
	 * @return the list
	 */
	public List<T> deplete(List<T> list, String flow) {
		List<T> depletables = new ArrayList<>();
		depletables.addAll(list);
		int count = depletables.size();
		boolean repeat = true;
		do {
			Iterator<T> iterator = depletables.iterator();
			while (iterator.hasNext()) {
				ITopologicallyDepletable depletable = iterator.next();
				if (depletable.complete(flow)) {
					iterator.remove();
				}
			}
			repeat = count > depletables.size();
			count = depletables.size();
		} while (repeat);
		return depletables;
	}

}
